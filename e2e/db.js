const { Client } = require('pg')

const postgresDatabase = 'indexer'
const postgresPassword = 'docker'

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function psql(statement, timeoutSeconds) {

  timeoutSeconds = timeoutSeconds || 0
  let now = Date.now()
  const end = now + timeoutSeconds*1000

  while (true) {
    try {
      // Easiest to re-create the client pg allows client to connect once and
      // there might be a race where we connect to postgres, get disconnected,
      // and then need to re-connect.
      const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: postgresDatabase,
        password: postgresPassword,
        port: 5432,
      })
      await client.connect()

      const result = await client.query(statement)
      if (result.rowCount) {
        return result.rows
      }
      throw new Error('Empty result')
    } catch (error) {
      now = Date.now()
      if (now > end) {
        console.log(`Timed out executing '${statement}'`)
        throw error
      }
      await sleep(1000)
    }
  }
}

module.exports = {
  postgresDatabase: 'indexer',
  postgresPassword: 'docker',
  psql
}

const { spawn, spawnSync } = require('child_process')
const { Client } = require('pg')

const debug = false
const createPostgresContainer = true
const deletePostgresContainer = true

const postgresContainerName = 'indexer-postgres-e2e'

function run(command, args, options) {
  options = options || {}
  if (debug) console.log(`${command} \\\n  ${args.join(' \\\n  ')}`)
  const result = spawnSync(command, args, options)
  if (result.error) {
    throw result.error
  } else if (result.status) {
    throw new Error(`${command} failed: ${result.status}`)
  } else if (result.signal) {
    throw new Error(`${command} exited from signal: ${result.signal}`)
  }
  return result
}

function docker(args, options) {
  options = options || {}
  options = {
    ...options,
    env: {
      ...process.env,
      ...options.env
    }
  }
  return run('docker', args, options)
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
        database: 'indexer',
        password: 'docker',
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

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function main() {
  let indexerChildProcess = null

  const exitHandler = () => {
    if (indexerChildProcess) {
      indexerChildProcess.kill('SIGINT')
    }
    if (deletePostgresContainer) {
      docker(['rm', '-f', postgresContainerName])
    }
  }
  process.on('exit', exitHandler)
  process.on('SIGINT', () => process.exit(1))
  process.on('SIGTERM', () => process.exit(1))  
  
  if (createPostgresContainer) {
    docker(['run',
            '--name', postgresContainerName,
            '--rm',
            '-d',
            '-p', '5432:5432',
            '-e', 'POSTGRES_DB=indexer',
            '-e', 'POSTGRES_PASSWORD=docker',
            'postgres'])
  }

  // Ensure DB is up before starting indexer
  await psql('SELECT 1;', 30)
  
  indexerChildProcess = spawn('node', ['./dist/bin/indexer.js'], {stdio: 'inherit'})
  console.log('Waiting for DB to have some contents...')
  await psql('SELECT * FROM transfers LIMIT 1;', 30)
  console.log('DB has some contents')

  // TODO: run more checks on the DB to ensure things look reasonable.
  process.exit(0)
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})

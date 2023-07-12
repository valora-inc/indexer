const { spawn, spawnSync } = require('child_process')
const db = require('./db')
const fetch = require('node-fetch')

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
      ...options.env,
    },
  }
  return run('docker', args, options)
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function main() {
  let indexerChildProcess = null
  let mockDataScriptProcess = null

  const exitHandler = () => {
    if (indexerChildProcess) {
      indexerChildProcess.kill('SIGINT')
    }
    if (mockDataScriptProcess) {
      mockDataScriptProcess.kill('SIGINT')
    }
    if (deletePostgresContainer) {
      docker(['rm', '-f', postgresContainerName])
    }
  }
  process.on('exit', exitHandler)
  process.on('SIGINT', () => process.exit(1))
  process.on('SIGTERM', () => process.exit(1))

  if (createPostgresContainer) {
    docker([
      'run',
      '--name',
      postgresContainerName,
      '--rm',
      '-d',
      '-p',
      '5432:5432',
      '-e',
      `POSTGRES_DB=${db.postgresDatabase}`,
      '-e',
      `POSTGRES_PASSWORD=${db.postgresPassword}`,
      'postgres',
    ])
  }

  // Ensure DB is up before starting indexer
  await db.psql('SELECT 1;', 30)

  const env = {
    WEB3_PROVIDER_URL: 'https://alfajores-forno.celo-testnet.org',
    RECENT_BLOCK_NUMBER: '1',
    ...process.env,
  }

  // test add-mock-recent-data script
  mockDataScriptProcess = spawn(
    'ts-node',
    ['./scripts/add-mock-recent-data.ts'],
    {
      stdio: 'inherit',
      env,
    },
  )
  const lastBlocksRows = await db.psql('SELECT * FROM last_blocks LIMIT 1;', 30)
  const blockMetadataRows = await db.psql(
    'SELECT * FROM block_metadata LIMIT 1;',
    30,
  )

  console.log(
    `mock recent data script loads db with contents: ${JSON.stringify(
      { lastBlocksRows, blockMetadataRows },
      null,
      2,
    )}`,
  )
  indexerChildProcess = spawn('node', ['./dist/bin/indexer.js'], {
    stdio: 'inherit',
    env,
  })
  console.log('Waiting for DB to have some contents...')
  const rows = await db.psql('SELECT * FROM transfers LIMIT 1;', 30)
  console.log(`DB has some contents: ${JSON.stringify(rows, null, 2)}`)

  console.log('Fetching indexer status')
  const statusResponse = await fetch('http://localhost:8080/status')
  const { blocksBehind, blockWithinRange } = await statusResponse.json()
  console.log(`Indexer is ${blocksBehind} blocks behind`)
  if (!blocksBehind || blocksBehind <= 0) {
    throw new Error(
      'blocksBehind should be greater than 0 for indexer that just started from block 1',
    )
  }
  if (blockWithinRange === undefined || blockWithinRange === true) {
    throw new Error(
      'blockWithinRange should be false for indexer that just started from block 1',
    )
  }

  const statusResponse2 = await fetch(
    'http://localhost:8080/status?max_blocks_behind=10000000000', // should not get here for another 1,582 years
  )
  const { blockWithinRange: blockWithinRange2 } = await statusResponse2.json()
  if (!blockWithinRange2) {
    throw new Error(
      `blockWithinRange should be true for extremely high max_blocks_behind`,
    )
  }

  // TODO: run more checks on the DB to ensure things look reasonable.
  process.exit(0)
}

main().catch((err) => {
  console.log(err)
  process.exit(1)
})

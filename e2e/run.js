const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const debug = false
const createCluster = true
const deleteCluster = true
const dockerBuild = true
const runIndexer = true

const timeoutSeconds = 60

const clusterName = 'indexer-cluster'
const kindConfig = path.join(__dirname, 'kind.yaml')
const kindImage = 'kindest/node:v1.16.15'
const kubeconfig = path.join(__dirname, '.kubeconfig')

const sourceKubernetesYaml = path.resolve(path.join(__dirname, '..', 'kubernetes.yaml'))
const kubernetesYaml = path.resolve(path.join(__dirname, '.kubernetes.yaml'))

function run(command, args, options) {
  options = options || {}
  if (debug) console.log(`${command} \\\n  ${args.join(' \\\n  ')}`)
  const result = spawnSync(command, args, {stdio: 'inherit', ...options})
  if (result.error) {
    throw result.error
  } else if (result.status) {
    throw new Error(`${command} failed: ${result.status}`)
  } else if (result.signal) {
    throw new Error(`${command} exited from signal: ${result.signal}`)
  }
  return result
}

function kubectl(args, options) {
  options = options || {}
  options = {
    ...options,
    env: {
      KUBECONFIG: kubeconfig,
      ...process.env,
      ...options.env
    }
  }
  return run('kubectl', args, options)
}

function kind(args, options) {
  args = [...args, '--name', clusterName]
  options = options || {}
  options = {
    ...options,
    env: {
      KUBECONFIG: kubeconfig,
      ...process.env,
      ...options.env
    }
  }
  run('kind', args, options)
}

function psql(statement) {
  const result = kubectl(['exec', 'postgres-0', '--',
                          'psql',
                          '-t',
                          '--csv',
                          '-U', 'postgres',
                          '-d', 'postgres',
                          '-c', statement],
                         {stdio: 'pipe'})
  if (result.output[1])
    return result.output[1].toString()
  return ''
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function main() {
  const exitHandler = () => {
    if (deleteCluster) {
      kind(['delete', 'cluster'])
    }
  }
  process.on('exit', exitHandler)

  if (createCluster) {
    kind(['create', 'cluster',
          '--verbosity', '4',
          '--config', kindConfig,
          '--image', kindImage])
  }

  if (dockerBuild) {
    run('docker',
        ['build', '-t', 'indexer:test', '.'],
        {stdio: 'inherit'})
    kind(['load', 'docker-image', '--name', clusterName, 'indexer:test'])
  }

  const yaml = fs.readFileSync(sourceKubernetesYaml).toString().replace('gcr.io/valora-inc/indexer:latest', 'indexer:test')
  fs.writeFileSync(kubernetesYaml, yaml)

  try {
    if (runIndexer) {
      kubectl(['apply', '-f', kubernetesYaml])

      // Wait for Pods to start...
      await sleep(5000)  // Give kubernetes a moment to create initial resources
      kubectl(['wait', '--for=condition=Available', 'deployment/indexer'])
      kubectl(['wait', '--for=condition=Ready', '--timeout=60s', 'pod', '-l', 'app=indexer'])
      kubectl(['wait', '--for=condition=Ready', '--timeout=60s', 'pod', '-l', 'app=postgres'])      

      // and wait for the DB to have something interesting in it.
      let now = Date.now()
      const end = now + timeoutSeconds*1000
      while (true) {
        try {
          const result = psql('SELECT * FROM transfers LIMIT 1;')
          if (result === '')
            throw Error('Empty result')
          break
        } catch (error) {
          now = Date.now()
          if (now > end) {
            console.log('Timed out waiting for DB contents!')
            throw error
          }
          console.log('Waiting for some DB contents..')
          await sleep(1000)
        }
      }
    }
    console.log('DB has some contents')
    // TODO: DB has some contents, do some extra end-to-end checks.
  } catch (error) {
    console.log('## pods')
    kubectl(['get', 'pods'])
    console.log('## indexer logs')
    kubectl(['logs', '-l', 'app=indexer'])
    throw error
  }
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})

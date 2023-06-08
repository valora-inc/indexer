import { PORT } from '../src/config'
import initApp from '../src'
import loadSecretEnvironment from '../src/secret-manager'

async function main() {
  if (process.env.DB_SECRET_NAME) {
    await loadSecretEnvironment(process.env.DB_SECRET_NAME)
  }

  const app = await initApp()
  app.listen(PORT, () => {
    console.info(`App listening on port ${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

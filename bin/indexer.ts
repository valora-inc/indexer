import { PORT } from './config'
import initApp from './'

async function main() {
  const app = await initApp()
  app.listen(PORT, () => {
    console.info(`App listening on port ${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

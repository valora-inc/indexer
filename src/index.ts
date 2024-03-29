import express from 'express'

import { ENVIRONMENT, PORT, VERSION } from './config'
import { initDatabase } from './database/db'
import { pollers } from './polling'
import { getStatusHandler } from './status'

export default async function initApp(): Promise<express.Application> {
  console.info(
    'Service starting with environment, version:',
    ENVIRONMENT,
    VERSION,
  )
  const START_TIME = Date.now()

  /**
   * Create and configure Express server
   * This is a necessary requirement for an app to run stably on App Engine
   */
  console.info('Creating express server')
  const app = express()
  app.set('port', PORT)
  app.set('env', ENVIRONMENT)
  app.use(express.json())

  // Primary app routes.
  app.get('/', (req: any, res: any) => {
    res.send('Celo Indexer. See /status for details.')
  })
  app.get('/status', getStatusHandler(START_TIME))
  app.get('/_ah/start', (req: any, res: any) => {
    res.status(200).end()
  })

  try {
    await initDatabase()
    pollers.forEach((poller) => poller.run())
  } catch (error) {
    console.error('Error initializing database', error)
    throw error
  }

  return app
}

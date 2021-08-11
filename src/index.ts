import express from 'express'

import { ENVIRONMENT, PORT, VERSION, WEB3_PROVIDER_URL } from './config'
import { initDatabase } from './database/db'
import { pollers } from './polling'

export default async function initApp() : Promise<express.Application> {
  if (!WEB3_PROVIDER_URL) {
    throw new Error('You must set the WEB3_PROVIDER_URL environment variable.')
  }

  console.info('Service starting with environment, version:', ENVIRONMENT, VERSION)
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
  app.get('/status', (req: any, res: any) => {
    res.status(200).json({
      version: VERSION,
      serviceStartTime: new Date(START_TIME).toUTCString(),
      serviceRunDuration: Math.floor((Date.now() - START_TIME) / 60000) + ' minutes',
    })
  })
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

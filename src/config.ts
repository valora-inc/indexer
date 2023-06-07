import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const VERSION = process.env.GAE_VERSION
export const ENVIRONMENT = process.env.ENVIRONMENT
export const PORT = Number(process.env.PORT) || 8080
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE
export const INVITES_POLLING_INTERVAL =
  Number(process.env.INVITES_POLLING_INTERVAL) || 60000
export const ACCOUNTS_POLLING_INTERVAL =
  Number(process.env.ACCOUNTS_POLLING_INTERVAL) || 60000
export const ATTESTATIONS_POLLING_INTERVAL =
  Number(process.env.ATTESTATIONS_POLLING_INTERVAL) || 60000
export const TRANSFERS_POLLING_INTERVAL =
  Number(process.env.TRANSFERS_POLLING_INTERVAL) || 5000

export const JITTER = Number(process.env.JITTER) || 1000

export const BLOCK_METADATA_POLLING_INTERVAL =
  Number(process.env.BLOCK_METADATA_POLLING_INTERVAL) || 5000
export const BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER =
  Number(process.env.BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER) || 19546425 // arbitrarily chosen from before rate limiting outage
export const BLOCK_METADATA_POOL_LIMIT =
  Number(process.env.BLOCK_METADATA_POOL_LIMIT) || 100 // QuickNode limits us to 300 requests/second. leaves buffer for other kinds of RPC requests
export const BLOCK_METADATA_MIN_BATCH_PERIOD_MS =
  Number(process.env.BLOCK_METADATA_MIN_BATCH_PERIOD_MS) || 1000 // minimum time to process 1 batch. increase if hitting rate limits with RPC provider.

export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL || 'UNDEFINED'

export const MCUSD_ADDRESS = process.env.MCUSD_ADDRESS
export const MCEUR_ADDRESS = process.env.MCEUR_ADDRESS
export const MCREAL_ADDRESS = process.env.MCREAL_ADDRESS

import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const VERSION = process.env.GAE_VERSION
export const ENVIRONMENT = process.env.ENVIRONMENT
// App engine is setting the PORT to 8081 which doesn't work. hardcoding to 8080
// works, TODO(any): resolve this once we hear back from google
export const PORT = 8080
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE
export const INVITES_POLLING_INTERVAL =
  Number(process.env.INVITES_POLLING_INTERVAL) || 60000
export const ACCOUNTS_POLLING_INTERVAL =
  Number(process.env.ACCOUNTS_POLLING_INTERVAL) || 60000
export const ATTESTATIONS_POLLING_INTERVAL =
  Number(process.env.ATTESTATIONS_POLLING_INTERVAL) || 60000
export const TRANSFERS_POLLING_INTERVAL =
  Number(process.env.TRANSFERS_POLLING_INTERVAL) || 5000

export const BLOCK_METADATA_POLLING_INTERVAL =
  Number(process.env.BLOCK_METADATA_POLLING_INTERVAL) || 5000
export const BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER =
  Number(process.env.BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER) || 19546425 // a block number from before rate limiting outage. would probably only want to override for testing.

export const MCUSD_ADDRESS = process.env.MCUSD_ADDRESS
export const MCEUR_ADDRESS = process.env.MCEUR_ADDRESS
export const MCREAL_ADDRESS = process.env.MCREAL_ADDRESS

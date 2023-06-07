import AsyncPolling from 'async-polling'
import {
  BLOCK_METADATA_POLLING_INTERVAL,
  ACCOUNTS_POLLING_INTERVAL,
  ATTESTATIONS_POLLING_INTERVAL,
  INVITES_POLLING_INTERVAL,
  TRANSFERS_POLLING_INTERVAL, JITTER,
} from './config'
import {handleAccountMappings} from './indexer/accounts'
import {handleAttestations} from './indexer/attestations'
import {handleInvites} from './indexer/invites'
import {handleTransfers} from './indexer/transfers'
import {sleepRandom} from "./util/sleep"
import {handleBlockMetadata} from "./indexer/block-metadata";

export const pollers = [
  {fx: handleInvites, interval: INVITES_POLLING_INTERVAL},
  {fx: handleAccountMappings, interval: ACCOUNTS_POLLING_INTERVAL},
  {fx: handleAttestations, interval: ATTESTATIONS_POLLING_INTERVAL},
  {fx: handleBlockMetadata, interval: BLOCK_METADATA_POLLING_INTERVAL},
  {fx: handleTransfers, interval: TRANSFERS_POLLING_INTERVAL},
].map((poller) =>
  AsyncPolling(async (end) => {
    try {
      await sleepRandom(JITTER) // helps avoid rate limits by spreading out requests to RPC provider
      await poller.fx()
    } catch (e) {
      console.error('Polling failed', e)
    } finally {
      end()
    }
  }, poller.interval),
)

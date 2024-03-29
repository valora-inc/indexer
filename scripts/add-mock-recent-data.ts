/**
 * Add mock data to the local indexer database to simulate running an up-to-date indexer.
 *
 * Otherwise running the indexer locally tests what the indexer does to catch up after falling far behind,
 *   which is different than the average case when the indexer is running normally and its db is relatively up to date.
 */

import { database, initDatabase } from '../src/database/db'
import {
  BLOCK_METADATA_TABLE_NAME,
  BLOCK_NUMBER_COL_NAME,
  BLOCK_TIMESTAMP_COL_NAME,
} from '../src/indexer/block-metadata'
import { getContractKit } from '../src/util/utils'
import { LAST_BLOCKS_TABLE_NAME } from '../src/indexer/blocks'
import * as process from 'process'
import { contractsAndCurrencies } from '../src/indexer/transfers'

async function main() {
  await initDatabase()

  // block metadata
  const contractKit = await getContractKit()
  const recentBlockNumber = process.env.RECENT_BLOCK_NUMBER
    ? process.env.RECENT_BLOCK_NUMBER // to make e2e tests more predictable (otherwise depends on events getting emitted while the test is taking place for certain contracts on alfajores)
    : (await contractKit.web3.eth.getBlockNumber()) - 6 // 30 seconds behind
  const blockTimestamp = Number(
    (await contractKit.web3.eth.getBlock(recentBlockNumber)).timestamp,
  )
  await database(BLOCK_METADATA_TABLE_NAME)
    .insert({
      [BLOCK_NUMBER_COL_NAME]: recentBlockNumber,
      [BLOCK_TIMESTAMP_COL_NAME]: blockTimestamp,
    })
    .onConflict(BLOCK_NUMBER_COL_NAME)
    .ignore() // do nothing if row already exists with same blockNumber

  // events
  for (const key of [
    'Escrow_Withdrawal',
    'Escrow_Transfer',
    'Escrow_Revocation',
    'Accounts_AccountWalletAddressSet',
    'Attestations_AttestationCompleted',
  ].concat(
    contractsAndCurrencies.map(({ contract }) => `${contract}_Transfer`),
  )) {
    await database(LAST_BLOCKS_TABLE_NAME)
      .insert({
        key,
        lastBlock: recentBlockNumber,
      })
      .onConflict('key')
      .merge() // overwrite if exists
  }
}

main()
  .catch(console.error)
  .then(() => {
    console.log('done adding mock data to db')
    process.exit(0)
  })

import { database } from '../database/db'
import * as _ from 'lodash'
import asyncPool from 'tiny-async-pool'
import { getContractKit } from '../util/utils'
import { sleep } from '../util/sleep'
import {
  BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER,
  BLOCK_METADATA_MIN_BATCH_PERIOD_MS,
  BLOCK_METADATA_POOL_LIMIT,
} from '../config'

const TABLE_NAME = 'block_metadata'

export async function handleBlockMetadata() {
  try {
    const contractKit = await getContractKit()

    const currentBlockNumber = await contractKit.web3.eth.getBlockNumber()
    const lastBlockNumberIndexed =
      (await database(TABLE_NAME).max('blockNumber').first())?.blockNumber ??
      BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER
    const fromBlock = lastBlockNumberIndexed + 1
    console.info(
      `Indexing block metadata between blocks [${fromBlock}, ${currentBlockNumber}]`,
    )
    await database.transaction(async (trx) => {
      await asyncPool(
        BLOCK_METADATA_POOL_LIMIT,
        _.range(fromBlock, currentBlockNumber + 1),
        async (blockNumber) => {
          const start = Date.now()
          const blockTimestamp = (
            await contractKit.web3.eth.getBlock(blockNumber)
          )?.timestamp
          if (!blockTimestamp) {
            throw new Error(
              `Could not get block timestamp for block ${blockNumber}`,
            )
          }
          await database(TABLE_NAME)
            .insert({
              blockNumber,
              blockTimestamp,
            })
            .onConflict('blockNumber')
            .ignore() // do nothing if row already exists with same blockNumber
            .transacting(trx)

          // avoid RPC rate limits
          const elapsedMs = Date.now() - start
          if (elapsedMs < BLOCK_METADATA_MIN_BATCH_PERIOD_MS) {
            await sleep(BLOCK_METADATA_MIN_BATCH_PERIOD_MS - elapsedMs)
          }
        },
      )
    })
  } catch (error) {
    console.error(`Error indexing block metadata: ${error}`)
  }
}

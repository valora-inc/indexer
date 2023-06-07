import { JsonRpcProvider } from 'ethers'
import { WEB3_PROVIDER_URL } from '../config'
import { database } from '../database/db'
import * as _ from 'lodash'
import asyncPool from 'tiny-async-pool'

const TABLE_NAME = 'block_metadata'

export async function handleBlockMetadata() {
  try {
    const provider = new JsonRpcProvider(WEB3_PROVIDER_URL)
    const currentBlockNumber = await provider.getBlockNumber()
    const lastBlockNumberIndexed =
      (await database(TABLE_NAME).max('blockNumber').first())?.blockNumber ??
      100 // TODO replace default with May 30 block
    await database.transaction(async (trx) => {
      await asyncPool(
        50,
        _.range(lastBlockNumberIndexed + 1, currentBlockNumber + 1),
        async (blockNumber) => {
          const blockTimestamp = (await provider.getBlock(blockNumber))
            ?.timestamp
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
        },
      )
    })
  } catch (error) {
    console.error(`Error indexing block metadata: ${error}`)
  }
}

import { database } from '../database/db'
import { getContractKit } from '../util/utils'
import { BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER } from '../config'

export const BLOCK_METADATA_TABLE_NAME = 'block_metadata'
export const BLOCK_NUMBER_COL_NAME = 'blockNumber'
export const BLOCK_TIMESTAMP_COL_NAME = 'blockTimestamp'

export async function handleBlockMetadata() {
  try {
    const contractKit = await getContractKit()

    const currentBlockNumber = await contractKit.web3.eth.getBlockNumber()
    const lastBlockNumberIndexed = (
      await database(BLOCK_METADATA_TABLE_NAME)
        .max({ [BLOCK_NUMBER_COL_NAME]: BLOCK_NUMBER_COL_NAME })
        .first()
    )?.[BLOCK_NUMBER_COL_NAME]
    let blockNumber = lastBlockNumberIndexed
      ? lastBlockNumberIndexed + 1
      : BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER
    console.info(
      `Indexing block metadata between blocks [${blockNumber}, ${currentBlockNumber}]`,
    )
    while (blockNumber <= currentBlockNumber) {
      const blockTimestamp = Number(
        (await contractKit.web3.eth.getBlock(blockNumber)).timestamp,
      )
      await database(BLOCK_METADATA_TABLE_NAME)
        .insert({
          [BLOCK_NUMBER_COL_NAME]: blockNumber,
          [BLOCK_TIMESTAMP_COL_NAME]: blockTimestamp,
        })
        .onConflict(BLOCK_NUMBER_COL_NAME)
        .ignore() // do nothing if row already exists with same blockNumber
      blockNumber++
    }
    console.info(`Indexed block metadata up to block ${blockNumber - 1}`)
  } catch (error) {
    console.error(`Error indexing block metadata: ${error}`)
  }
}

import { database } from '../database/db'
import { getContractKit } from '../util/utils'
import { BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER } from '../config'

const TABLE_NAME = 'block_metadata'

export async function handleBlockMetadata() {
  try {
    const contractKit = await getContractKit()

    const currentBlockNumber = await contractKit.web3.eth.getBlockNumber()
    const lastBlockNumberIndexed =
      (await database(TABLE_NAME).max('blockNumber').first())?.blockNumber ??
      BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER
    let blockNumber = lastBlockNumberIndexed + 1
    console.info(
      `Indexing block metadata between blocks [${blockNumber}, ${currentBlockNumber}]`,
    )
    while (blockNumber <= currentBlockNumber) {
      const blockTimestamp = Number(
        (await contractKit.web3.eth.getBlock(blockNumber)).timestamp,
      )
      await database(TABLE_NAME)
        .insert({
          blockNumber,
          blockTimestamp,
        })
        .onConflict('blockNumber')
        .ignore() // do nothing if row already exists with same blockNumber
      blockNumber++
    }
    console.info(`Indexed block metadata up to block ${blockNumber - 1}`)
  } catch (error) {
    console.error(`Error indexing block metadata: ${error}`)
  }
}

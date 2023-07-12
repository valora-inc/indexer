import { database } from './database/db'
import { LAST_BLOCKS_TABLE_NAME } from './indexer/blocks'
import { VERSION } from './config'
import { Event } from './indexer'
import { getContractKit } from './util/utils'
import { Request, Response } from 'express'
import { asyncRoute } from './util/async-route'

export function getStatusHandler(startTime: number) {
  return asyncRoute(async (_req: Request, res: Response) => {
    const kit = await getContractKit()
    const curBlockNumber = await kit.web3.eth.getBlockNumber()
    const minTransferLastBlock = await database(LAST_BLOCKS_TABLE_NAME)
      .min('lastBlock as minLastBlock')
      .where('key', 'like', `%_${Event.Transfer}`)

    res.status(200).json({
      version: VERSION,
      serviceStartTime: new Date(startTime).toUTCString(),
      serviceRunDuration:
        Math.floor((Date.now() - startTime) / 60000) + ' minutes',
      blocksBehind: minTransferLastBlock.length
        ? curBlockNumber - (minTransferLastBlock[0].minLastBlock ?? 0)
        : curBlockNumber,
    })
  })
}

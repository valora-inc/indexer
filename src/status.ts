import { database } from './database/db'
import { LAST_BLOCKS_TABLE_NAME } from './indexer/blocks'
import { VERSION } from './config'
import { Event } from './indexer'
import { getContractKit } from './util/utils'
import { Request, Response } from 'express'
import { asyncRoute } from './util/async-route'

const BLOCKS_PER_MINUTE = 12
export const DEFAULT_MAX_BLOCKS_BEHIND = BLOCKS_PER_MINUTE * 120 // 2 hours

export function getStatusHandler(startTime: number) {
  return asyncRoute(async (req: Request, res: Response) => {
    const maxBlocksBehind = req.query?.max_blocks_behind
      ? parseInt(req.query.max_blocks_behind.toString())
      : DEFAULT_MAX_BLOCKS_BEHIND

    const kit = await getContractKit()
    const curBlockNumber = await kit.web3.eth.getBlockNumber()
    const minTransferLastBlock = await database(LAST_BLOCKS_TABLE_NAME)
      .min('lastBlock as minLastBlock')
      .where('key', 'like', `%_${Event.Transfer}`)

    const blocksBehind = minTransferLastBlock.length
      ? curBlockNumber - (minTransferLastBlock[0].minLastBlock ?? 0)
      : curBlockNumber

    res.status(200).json({
      version: VERSION,
      serviceStartTime: new Date(startTime).toUTCString(),
      serviceRunDuration:
        Math.floor((Date.now() - startTime) / 60000) + ' minutes',
      blocksBehind,
      blockWithinRange: blocksBehind < maxBlocksBehind,
    })
  })
}

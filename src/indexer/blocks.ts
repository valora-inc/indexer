import { database } from '../database/db'

export const LAST_BLOCKS_TABLE_NAME = 'last_blocks'

export async function getLastBlock(key: string) {
  const row = await database(LAST_BLOCKS_TABLE_NAME).where({ key }).first()
  return row?.lastBlock ?? 0
}

export function setLastBlock(key: string, block: number) {
  return database(LAST_BLOCKS_TABLE_NAME)
    .insert({ key, lastBlock: block })
    .onConflict('key')
    .merge()
}

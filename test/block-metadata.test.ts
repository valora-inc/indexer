import { mocked } from 'ts-jest/utils'
import { getContractKit } from '../src/util/utils'
import { ContractKit } from '@celo/contractkit'
import { database, initDatabase } from '../src/database/db'
import { handleBlockMetadata } from '../src/indexer/block-metadata'

jest.mock('../src/util/utils')
jest.mock('../src/config', () => ({
  BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER: 100,
}))

describe('block metadata', () => {
  const mockGetBlockNumber = jest.fn()
  const mockGetBlock = jest
    .fn()
    .mockImplementation((blockNumber) => ({ timestamp: blockNumber * 10 }))
  const mockContractKit = {
    web3: {
      eth: {
        getBlockNumber: mockGetBlockNumber,
        getBlock: mockGetBlock,
      },
    },
  } as unknown as ContractKit
  beforeEach(async () => {
    await initDatabase()
    await database.table('block_metadata').truncate()
    jest.clearAllMocks()
    mocked(getContractKit).mockResolvedValue(mockContractKit)
  })
  afterEach(() => {
    return database.destroy()
  })
  it('saves block info when no rows exist in block_metadata', async () => {
    const mockCurrentBlockNumber = 101
    mockGetBlockNumber.mockResolvedValue(mockCurrentBlockNumber)

    await handleBlockMetadata()
    const rows = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rows).toEqual([
      {
        blockNumber: 100,
        blockTimestamp: 1000,
      },
      {
        blockNumber: 101,
        blockTimestamp: 1010,
      },
    ])
  })
  it('saves only new block info when rows exist in block_metadata', async () => {
    const mockLastBlockIndexed = 105
    await database('block_metadata').insert({
      blockNumber: mockLastBlockIndexed,
      blockTimestamp: mockLastBlockIndexed * 10,
    })
    expect(
      (
        await database('block_metadata')
          .max({ blockNumber: 'blockNumber' })
          .first()
      )?.blockNumber,
    ).toEqual(mockLastBlockIndexed)
    const mockCurrentBlockNumber = mockLastBlockIndexed + 2
    mockGetBlockNumber.mockResolvedValue(mockCurrentBlockNumber)

    await handleBlockMetadata()
    const rows = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rows).toEqual([
      {
        blockNumber: mockLastBlockIndexed,
        blockTimestamp: mockLastBlockIndexed * 10,
      },
      {
        blockNumber: mockLastBlockIndexed + 1,
        blockTimestamp: (mockLastBlockIndexed + 1) * 10,
      },
      {
        blockNumber: mockLastBlockIndexed + 2,
        blockTimestamp: (mockLastBlockIndexed + 2) * 10,
      },
    ])
  })
  it('does nothing when no new blocks to index', async () => {
    const mockLastBlockIndexed = 105
    await database('block_metadata').insert({
      blockNumber: mockLastBlockIndexed,
      blockTimestamp: mockLastBlockIndexed * 10,
    })
    mockGetBlockNumber.mockResolvedValue(mockLastBlockIndexed)

    await handleBlockMetadata()
    const rows = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rows).toEqual([
      {
        blockNumber: mockLastBlockIndexed,
        blockTimestamp: mockLastBlockIndexed * 10,
      },
    ])
  })
  it('when an error occurs indexing some block, avoids skipping that block on next run', async () => {
    const mockCurrentBlockNumber = 102
    mockGetBlockNumber.mockResolvedValue(mockCurrentBlockNumber)
    let threwError = false
    mockGetBlock.mockImplementation((blockNumber) => {
      if (blockNumber === 101 && !threwError) {
        threwError = true
        throw new Error('mock error')
      }
      return { timestamp: blockNumber * 10 }
    })
    await handleBlockMetadata()
    const rowsAfterFirstRun = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rowsAfterFirstRun).toEqual([
      {
        blockNumber: 100,
        blockTimestamp: 1000,
      },
    ])
    await handleBlockMetadata()
    const rowsAfterSecondRun = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rowsAfterSecondRun).toEqual([
      {
        blockNumber: 100,
        blockTimestamp: 1000,
      },
      {
        blockNumber: 101,
        blockTimestamp: 1010,
      },
      {
        blockNumber: 102,
        blockTimestamp: 1020,
      },
    ])
  })
})

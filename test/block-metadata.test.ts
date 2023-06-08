import { mocked } from 'ts-jest/utils'
import { getContractKit } from '../src/util/utils'
import { ContractKit } from '@celo/contractkit'
import { database, initDatabase } from '../src/database/db'
import { handleBlockMetadata } from '../src/indexer/block-metadata'
import { BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER } from '../src/config'

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
    const mockCurrentBlockNumber = BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER + 1
    mockGetBlockNumber.mockResolvedValue(mockCurrentBlockNumber)

    await handleBlockMetadata()
    const rows = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rows).toEqual([
      {
        blockNumber: BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER,
        blockTimestamp: (
          BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER * 10
        ).toString(),
      },
      {
        blockNumber: BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER + 1,
        blockTimestamp: (
          (BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER + 1) *
          10
        ).toString(),
      },
    ])
  })
  it('saves only new block info when rows exist in block_metadata', async () => {
    const mockLastBlockIndexed = BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER + 5
    await database('block_metadata').insert({
      blockNumber: mockLastBlockIndexed,
      blockTimestamp: mockLastBlockIndexed * 10,
    })
    const mockCurrentBlockNumber = mockLastBlockIndexed + 2
    mockGetBlockNumber.mockResolvedValue(mockCurrentBlockNumber)

    await handleBlockMetadata()
    const rows = await database('block_metadata')
      .select('blockNumber', 'blockTimestamp')
      .orderBy('blockNumber') // ascending by default

    expect(rows).toEqual([
      {
        blockNumber: mockLastBlockIndexed,
        blockTimestamp: (mockLastBlockIndexed * 10).toString(),
      },
      {
        blockNumber: mockLastBlockIndexed + 1,
        blockTimestamp: ((mockLastBlockIndexed + 1) * 10).toString(),
      },
      {
        blockNumber: mockLastBlockIndexed + 2,
        blockTimestamp: ((mockLastBlockIndexed + 2) * 10).toString(),
      },
    ])
  })
  it('does nothing when no new blocks to index', async () => {
    const mockLastBlockIndexed = BLOCK_METADATA_DEFAULT_MIN_BLOCK_NUMBER + 5
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
        blockTimestamp: (mockLastBlockIndexed * 10).toString(),
      },
    ])
  })
})

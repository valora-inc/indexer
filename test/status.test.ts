import { ContractKit } from '@celo/contractkit'
import { database, initDatabase } from '../src/database/db'
import { mocked } from 'ts-jest/utils'
import { getContractKit } from '../src/util/utils'
import { DEFAULT_MAX_BLOCKS_BEHIND, getStatusHandler } from '../src/status'
import { Request, Response } from 'express'

jest.mock('../src/util/utils')
jest.mock('../src/config', () => ({
  VERSION: 'fake-version',
}))

describe('getStatusHandler', () => {
  const mockGetBlockNumber = jest.fn()
  const mockContractKit = {
    web3: {
      eth: {
        getBlockNumber: mockGetBlockNumber,
      },
    },
  } as unknown as ContractKit
  const minBlock = 5
  beforeEach(async () => {
    await initDatabase()
    await database.table('last_blocks').truncate()
    await database('last_blocks').insert([
      {
        key: 'testToken1_Transfer',
        lastBlock: minBlock,
      },
      {
        key: 'testToken2_Transfer',
        lastBlock: 10,
      },
    ])
    jest.clearAllMocks()
    mocked(getContractKit).mockResolvedValue(mockContractKit)
  })
  afterEach(() => {
    return database.destroy()
  })
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }
  const mockStartTime = 1689116816000 // epoch millis for july 11, 2023
  Date.now = jest.fn().mockReturnValue(mockStartTime + 150000) // 2.5 minutes past start time
  const mockNext = jest.fn()
  const statusHandler = getStatusHandler(mockStartTime)
  describe('without query parameters', () => {
    it('works when within range', async () => {
      mockGetBlockNumber.mockReturnValue(
        DEFAULT_MAX_BLOCKS_BEHIND + minBlock - 1,
      )
      await statusHandler(
        {} as unknown as Request,
        mockResponse as unknown as Response,
        mockNext,
      )
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toBeCalledWith(200)
      expect(mockResponse.json).toBeCalledWith({
        version: 'fake-version',
        serviceStartTime: 'Tue, 11 Jul 2023 23:06:56 GMT',
        serviceRunDuration: '2 minutes',
        blocksBehind: DEFAULT_MAX_BLOCKS_BEHIND - 1,
        blockWithinRange: true,
      })
    })
    it('works when too far behind', async () => {
      mockGetBlockNumber.mockReturnValue(DEFAULT_MAX_BLOCKS_BEHIND + minBlock)
      await statusHandler(
        {} as unknown as Request,
        mockResponse as unknown as Response,
        mockNext,
      )
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toBeCalledWith(200)
      expect(mockResponse.json).toBeCalledWith({
        version: 'fake-version',
        serviceStartTime: 'Tue, 11 Jul 2023 23:06:56 GMT',
        serviceRunDuration: '2 minutes',
        blocksBehind: DEFAULT_MAX_BLOCKS_BEHIND,
        blockWithinRange: false,
      })
    })
  })
  describe('using query parameters', () => {
    it('works when within range', async () => {
      mockGetBlockNumber.mockReturnValue(99 + minBlock)
      await statusHandler(
        { query: { max_blocks_behind: 100 } } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext,
      )
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toBeCalledWith(200)
      expect(mockResponse.json).toBeCalledWith({
        version: 'fake-version',
        serviceStartTime: 'Tue, 11 Jul 2023 23:06:56 GMT',
        serviceRunDuration: '2 minutes',
        blocksBehind: 99,
        blockWithinRange: true,
      })
    })
    it('works when too far behind', async () => {
      mockGetBlockNumber.mockReturnValue(100 + minBlock)
      await statusHandler(
        { query: { max_blocks_behind: 100 } } as unknown as Request,
        mockResponse as unknown as Response,
        mockNext,
      )
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockResponse.status).toBeCalledWith(200)
      expect(mockResponse.json).toBeCalledWith({
        version: 'fake-version',
        serviceStartTime: 'Tue, 11 Jul 2023 23:06:56 GMT',
        serviceRunDuration: '2 minutes',
        blocksBehind: 100,
        blockWithinRange: false,
      })
    })
  })
})

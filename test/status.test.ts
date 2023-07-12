import { ContractKit } from '@celo/contractkit'
import { database, initDatabase } from '../src/database/db'
import { mocked } from 'ts-jest/utils'
import { getContractKit } from '../src/util/utils'
import { getStatusHandler } from '../src/status'
import { Request, Response } from 'express'

jest.mock('../src/util/utils')
jest.mock('../src/config', () => ({
  VERSION: 'fake-version',
}))

describe('status', () => {
  const mockGetBlockNumber = jest.fn()
  const mockContractKit = {
    web3: {
      eth: {
        getBlockNumber: mockGetBlockNumber,
      },
    },
  } as unknown as ContractKit
  beforeEach(async () => {
    await initDatabase()
    await database.table('last_blocks').truncate()
    await database('last_blocks').insert([
      {
        key: 'testToken1_Transfer',
        lastBlock: 5,
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
  it('getStatusHandler', async () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    mockGetBlockNumber.mockResolvedValue(17)
    const mockStartTime = 1689116816000 // epoch millis for july 11, 2023
    Date.now = jest.fn().mockReturnValue(mockStartTime + 150000) // 2.5 minutes past start time
    await getStatusHandler(mockStartTime)(
      {} as unknown as Request,
      mockResponse as unknown as Response,
      jest.fn(),
    )
    expect(mockResponse.status).toBeCalledWith(200)
    expect(mockResponse.json).toBeCalledWith({
      version: 'fake-version',
      serviceStartTime: 'Tue, 11 Jul 2023 23:06:56 GMT',
      serviceRunDuration: '2 minutes',
      blocksBehind: 12,
    })
  })
})

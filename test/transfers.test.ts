import { indexEvents } from '../src/indexer'
import { mocked } from 'ts-jest/utils'
import { handleTransfers } from '../src/indexer/transfers'

jest.mock('../src/indexer')

describe('handleTransfers', () => {
  it('Indexes events for all supported tokens', async () => {
    const mockPayload = {
      returnValues: {
        from: '0x123',
        to: '0xabc',
        value: '456',
      },
    }
    const contractToCurrency = {
      // uses hardcoded keys like cUsd instead of Contract.cUsd because these shouldn't actually change. They're saved
      //  to the DB and used in queries. So if a value in Contract changes, we want a test to fail.
      cUsd: 'cUSD',
      cEur: 'cEUR',
      cReal: 'cREAL',
      mCUsd: 'mCUSD',
      mCEur: 'mCEUR',
      mCReal: 'mCREAL',
      celo: 'CELO',
    }
    const indexEventsMock = jest
      .fn()
      .mockImplementation((contract, _event, _tableName, payloadMapper) => {
        const mappedPayload = payloadMapper(mockPayload)
        if (!(contract in contractToCurrency)) {
          throw new Error(
            `Contract ${contract} not found in contractToCurrency. Make sure to add it to get coverage on labels for indexed data.`,
          )
        }
        const expectedCurrency =
          contractToCurrency[contract as keyof typeof contractToCurrency]
        expect(mappedPayload?.currency).toEqual(expectedCurrency)
      })
    mocked(indexEvents).mockImplementation(indexEventsMock)
    await handleTransfers()
    Object.keys(contractToCurrency).forEach((contract) => {
      expect(indexEventsMock).toHaveBeenCalledWith(
        contract,
        'Transfer',
        'transfers',
        expect.any(Function),
      )
    })
  })
})

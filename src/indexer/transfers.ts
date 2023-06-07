import { Contract, Event, indexEvents } from './index'

interface ContractAndCurrency {
  contract: Contract
  currency: string
}

const TRANSFERS_TABLE_NAME = 'transfers'

export async function handleTransfers() {
  const contractsAndCurrencies: ContractAndCurrency[] = [
    {
      contract: Contract.cUsd,
      currency: 'cUSD',
    },
    {
      contract: Contract.cEur,
      currency: 'cEUR',
    },
    {
      contract: Contract.cReal,
      currency: 'cREAL',
    },
    {
      contract: Contract.mCUsd,
      currency: 'mCUSD',
    },
    {
      contract: Contract.mCEur,
      currency: 'mCEUR',
    },
    {
      contract: Contract.mCReal,
      currency: 'mCREAL',
    },
    {
      contract: Contract.celo,
      currency: 'CELO',
    },
  ]
  for (const { contract, currency } of contractsAndCurrencies) {
    await indexEvents(
      contract,
      Event.Transfer,
      TRANSFERS_TABLE_NAME,
      ({ returnValues: { from, to, value } }) => ({
        from,
        to,
        value,
        currency,
      }),
    )
  }
}

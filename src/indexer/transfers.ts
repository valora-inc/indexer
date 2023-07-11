import { Contract, Event, indexEvents } from './index'

interface ContractAndCurrency {
  contract: Contract
  currency: string
}

const TRANSFERS_TABLE_NAME = 'transfers'

export const contractsAndCurrencies: ContractAndCurrency[] = [
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
export async function handleTransfers() {
  await Promise.all(
    contractsAndCurrencies.map(({ contract, currency }) =>
      indexEvents(
        contract,
        Event.Transfer,
        TRANSFERS_TABLE_NAME,
        ({ returnValues: { from, to, value } }) => ({
          from,
          to,
          value,
          currency,
        }),
      ),
    ),
  )
}

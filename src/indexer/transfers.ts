import { Contract, Event, indexEvents } from './index'

export async function handleTransfers() {
  await indexEvents(
    Contract.cUsd,
    Event.Transfer,
    'transfers',
    ({ returnValues: { from, to, value } }) => ({
      from,
      to,
      value,
      currency: 'cUSD',
    }),
  )
  await indexEvents(
    Contract.cEur,
    Event.Transfer,
    'transfers',
    ({ returnValues: { from, to, value } }) => ({
      from,
      to,
      value,
      currency: 'cEUR',
    }),
  )
  await indexEvents(
    Contract.cReal,
    Event.Transfer,
    'transfers',
    ({ returnValues: { from, to, value } }) => ({
      from,
      to,
      value,
      currency: 'cREAL',
    }),
  )
  await indexEvents(
    Contract.mCUsd,
    Event.Transfer,
    'transfers',
    ({ returnValues: { from, to, value } }) => ({
      from,
      to,
      value,
      currency: 'mCUSD',
    }),
  )
  await indexEvents(
    Contract.mCEur,
    Event.Transfer,
    'transfers',
    ({ returnValues: { from, to, value } }) => ({
      from,
      to,
      value,
      currency: 'mCEUR',
    }),
  )
  await indexEvents(
    Contract.mCReal,
    Event.Transfer,
    'transfers',
    ({ returnValues: { from, to, value } }) => ({
      from,
      to,
      value,
      currency: 'mCREAL',
    }),
  )
}

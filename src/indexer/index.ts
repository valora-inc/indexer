import { ContractKit, StableToken } from '@celo/contractkit'
import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { MCEUR_ADDRESS, MCREAL_ADDRESS, MCUSD_ADDRESS } from '../config'
import asyncPool from 'tiny-async-pool'
import { EventLog } from 'web3-core'
import { database } from '../database/db'
import { getContractKit } from '../util/utils'
import { getLastBlock, setLastBlock } from './blocks'

const TAG = 'Indexer'
const CONCURRENT_EVENTS_HANDLED = 5

export enum Contract {
  Accounts = 'Accounts',
  Escrow = 'Escrow',
  Attestations = 'Attestations',
  cUsd = 'cUsd',
  cEur = 'cEur',
  cReal = 'cReal',
  mCUsd = 'mCUsd',
  mCEur = 'mCEur',
  mCReal = 'mCReal',
  celo = 'celo',
}

// TODO: Add types for the events of each contract.
export enum Event {
  AccountWalletAddressSet = 'AccountWalletAddressSet',
  AttestationCompleted = 'AttestationCompleted',
  Revocation = 'Revocation',
  Transfer = 'Transfer',
  Withdrawal = 'Withdrawal',
}

// TODO: Rethink this interface. batchSize should be tied to contract + event, not just contract.
// Probably good to handle this together with the TODO on the Event enum.
interface ContractInfo {
  contract: (kit: ContractKit) => Promise<BaseWrapper<any>>
  batchSize: number
}

export const ERC20_TOKEN_BATCH_SIZE = 10_000

const contracts: { [contract in Contract]: ContractInfo } = {
  [Contract.Accounts]: {
    contract: (kit) => kit.contracts.getAccounts(),
    batchSize: 10000,
  },
  [Contract.Escrow]: {
    contract: (kit) => kit.contracts.getEscrow(),
    batchSize: 10000,
  },
  [Contract.Attestations]: {
    contract: (kit) => kit.contracts.getAttestations(),
    batchSize: 1000,
  },
  [Contract.cUsd]: {
    contract: (kit) => kit.contracts.getStableToken(StableToken.cUSD),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
  [Contract.cEur]: {
    contract: (kit) => kit.contracts.getStableToken(StableToken.cEUR),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
  [Contract.cReal]: {
    contract: (kit) => kit.contracts.getStableToken(StableToken.cREAL),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
  [Contract.mCUsd]: {
    contract: (kit) => kit.contracts.getErc20(MCUSD_ADDRESS!),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
  [Contract.mCEur]: {
    contract: (kit) => kit.contracts.getErc20(MCEUR_ADDRESS!),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
  [Contract.mCReal]: {
    contract: (kit) => kit.contracts.getErc20(MCREAL_ADDRESS!),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
  [Contract.celo]: {
    contract: (kit) => kit.contracts.getGoldToken(),
    batchSize: ERC20_TOKEN_BATCH_SIZE,
  },
}

export async function indexEvents(
  contractKey: Contract,
  contractEvent: Event,
  tableName: string,
  payloadMapper: (event: EventLog) => any,
) {
  const key = `${contractKey}_${contractEvent}`

  try {
    const kit = await getContractKit()
    let fromBlock = (await getLastBlock(key)) + 1
    const lastBlock = await kit.web3.eth.getBlockNumber()
    console.info(TAG, `${key} - Starting to fetch from block ${fromBlock}`)

    const { contract, batchSize } = contracts[contractKey]
    const contractWrapper = await contract(kit)

    while (fromBlock <= lastBlock) {
      const toBlock = Math.min(lastBlock, fromBlock + batchSize)
      const events = await contractWrapper.getPastEvents(contractEvent, {
        fromBlock,
        toBlock,
      })
      if (events.length > 0) {
        console.info(
          TAG,
          `${key} - Got ${events.length} events between blocks [${fromBlock}, ${toBlock}]`,
        )
      }
      fromBlock = toBlock + 1
      // Wrap write to event table and block index in a transaction so that the
      // update is atomic.
      await database.transaction(async (trx) => {
        await asyncPool(CONCURRENT_EVENTS_HANDLED, events, async (event) => {
          const { transactionHash, logIndex, blockNumber, blockHash } = event
          await database(tableName)
            .insert({
              transactionHash,
              logIndex,
              blockNumber,
              blockHash,
              ...payloadMapper(event),
            })
            .transacting(trx)
        })
        if (events.length > 0) {
          await setLastBlock(
            key,
            events[events.length - 1].blockNumber,
          ).transacting(trx)
        }
      })
    }
  } catch (error) {
    console.error(TAG, `${key} - Error while handling events`, error)
  }
}

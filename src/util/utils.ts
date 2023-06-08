import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'

let contractKit: ContractKit
export async function getContractKit(): Promise<ContractKit> {
  if (contractKit && (await contractKit.connection.isListening())) {
    // Already connected
    return contractKit
  } else if (!process.env.WEB3_PROVIDER_URL) {
    // TODO remove runtime check for missing required env var. https://linear.app/valora/issue/ACT-827/refactor-config
    // NOTE: we read from process.env here instead of importing from config.ts because secrets are loaded into process.env
    //  *after* config.ts is first imported, so config.ts would not have the correct values
    throw new Error('WEB3_PROVIDER_URL must be set')
  } else {
    const httpProvider = new Web3.providers.HttpProvider(
      process.env.WEB3_PROVIDER_URL,
    )
    const web3 = new Web3(httpProvider)
    contractKit = newKitFromWeb3(web3)
    return contractKit
  }
}

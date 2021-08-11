import {SecretManagerServiceClient} from '@google-cloud/secret-manager'
import dotenv from 'dotenv'

/*
 * Loads a dotenv config from Google Secret Manager and merges with process.env.
 */
export default async function loadSecretEnvironment(name: string, client?: SecretManagerServiceClient) {
  if (!client) {
    client = new SecretManagerServiceClient()
  }
  const [version] = await client.accessSecretVersion({name})
  const rawPayload = version.payload?.data?.toString();
  if (!rawPayload) {
    throw new RangeError(`Missing value for secret ${name}`)
  }

  const config = dotenv.parse(rawPayload)
  process.env = { ...process.env, ...config}
}

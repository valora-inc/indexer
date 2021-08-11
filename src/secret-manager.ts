import {SecretManagerServiceClient} from '@google-cloud/secret-manager'

/*
 * Loads a JSON object from Google Secret Manager. Copies each property into
 * process.env. Fails if any property values are not strings.
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
  const payload = JSON.parse(rawPayload)
  const nonString = Object.values(payload).find(value => typeof value !== 'string')
  if (nonString) {
    throw new RangeError(`Value ${nonString} is not a string`)
  }

  process.env = { ...process.env, ...payload}
}

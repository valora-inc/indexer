import {SecretManagerServiceClient} from '@google-cloud/secret-manager'

import loadSecretEnvironment from '../src/secret-manager'

describe('secret-manager', () => {
  describe('loadSecretEnvironment', () => {
    afterEach(() => {
      // Delete variables we might set.
      Object.keys(process.env).filter(key => key.startsWith('__TEST')).forEach(key => delete process.env[key])
    })
               
    it('updates process.env', async () => {
      const fakeClient = {
        accessSecretVersion: async () => {
          return [{
            payload: {
              data: '__TEST_FOO=bar\n__TEST_ZOO=cat'
            }
          }]
        }
      } as unknown as SecretManagerServiceClient

      await loadSecretEnvironment('/foo', fakeClient)
      expect(process.env.__TEST_FOO).toEqual('bar')
      expect(process.env.__TEST_ZOO).toEqual('cat')      
    })

    it('fails if missing secret', async () => {
      const fakeClient = {
        accessSecretVersion: async () => {
          return [{
            payload: {}
          }]
        }
      } as unknown as SecretManagerServiceClient

      await expect(loadSecretEnvironment('/foo', fakeClient)).rejects.toThrow()
    })
  })
})

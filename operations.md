# Indexer Operations

This document is intended to help engineers maintain the indexer and solve related on-call issues.

## Expected issues

### Web3 provider rate limits

The indexer pulls blockchain data from a full node aka web3 provider. We have seen the indexer exceed rate limits on 
our web3 provider in the past which brought the service to a halt, affecting analytics (no valora user transfer 
events going to BQ, Mixpanel, or Statsig). Retries along were not sufficient for the issue to go away without 
intervention.

#### Symptoms

Errors like this in the logs:

TODO

#### Troubleshooting

We may choose to use Forno as a web3 provider to save on cost. That being said, the indexer works well using QuickNode 
as a web3 provider, even when coming back from a several day pause. If rate limit issues are seen with Forno, consider 
changing the web3 provider to QuickNode. 

Note that QuickNode includes an API key in the web3 provider URL, so it is stored as a secret.

To change the web3 provider to QuickNode:
- delete `WEB3_PROVIDER_URL` from [app.mainnet.yaml](https://github.com/valora-inc/indexer/blob/bcd3d59a6ca622de528bcbc59a4ccb80cb78c631/app.mainnet.yaml#L6) if it is set there
- find the web3 provider url from the QuickNode dashboard. At time of writing the endpoint is located [here](https://dashboard.quicknode.com/endpoints/166850), see "HTTP Provider"
  - if you cannot access the QuickNode dashboard, ask an admin to add you. At time of writing, admins included Satish, Kathy, Silas, Charlie, Joe, and Jean.
- add `WEB3_PROVIDER_URL` to [indexer-secrets](https://console.cloud.google.com/security/secret-manager/secret/indexer-secrets/versions?project=celo-mobile-mainnet)

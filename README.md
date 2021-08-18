# Indexer Service

This service stores specific events on the Celo blockchain into a
relational database.

## Setup

Install dependencies:

```
yarn
```

## Running locally

Run a local PostgreSQL instance. For example:

```
docker run --rm -p 5432:5432 -e POSTGRES_DB=indexer -e POSTGRES_PASSWORD=docker postgres
```

Start the indexer:

```
yarn start:local
```

## Running on Kubernetes

You can use the example [kubernetes.yaml](kubernetes.yaml) directly:

```
kubectl apply -f https://raw.githubusercontent.com/valora-inc/indexer/main/kubernetes.yaml
```

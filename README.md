# Indexer Service

This service stores specific events on the Celo blockchain into a
relational database.

## Setup

Install dependencies:

```
yarn
```

## Running locally

Run a local PostgreSQL instance:

```
yarn run-local-db
```

If you want to test "normal behavior", where the indexer is all caught up to the latest data, you can simulate this
by running the add-mock-data script:
```
yarn add-mock-data
```

Start the indexer:

```
yarn start:local
```

## Adding a database migration

When you make changes to the database schema, you'll need to create a knex migration
```shell
yarn add-migration MyNewMigration
```
To test your migration locally:
```shell
yarn build
knex migrate:latest --client sqlite --migrations-directory ./dist/src/migrations --connection ':memory:'
```

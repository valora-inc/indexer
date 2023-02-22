import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  const tableNames = [
    'account_wallet_mappings',
    'attestations_completed',
    'escrow',
    'transfers',
  ]
  await Promise.all(
    tableNames.map(
      async (tableName) =>
        await knex.schema.alterTable(tableName, (table) =>
          table.bigInteger('timestamp'),
        ),
    ),
  )
}

export async function down(knex: Knex): Promise<void> {
  throw new Error('Unable to revert migration')
}

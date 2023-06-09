import { Knex } from 'knex'

const TABLE_NAMES = [
  'account_wallet_mappings',
  'attestations_completed',
  'escrow',
  'transfers',
]

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLE_NAMES) {
    await knex.schema.alterTable(tableName, (table) =>
      table.dropColumn('blockTimestamp'),
    )
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLE_NAMES) {
    await knex.schema.alterTable(tableName, (table) =>
      table.bigInteger('blockTimestamp'),
    )
  }
}

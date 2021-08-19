import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transfers', (table) => {
    table.index('blockNumber')
  })
}

export async function down(knex: Knex): Promise<void> {
  throw new Error('Unable to revert migration')
}

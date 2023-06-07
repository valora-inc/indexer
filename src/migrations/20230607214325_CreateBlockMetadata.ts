import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('block_metadata', (table) => {
    table.integer('blockNumber').primary()
    table.bigInteger('blockTimestamp')
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('block_metadata')
}


import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Nitros extends BaseSchema {
  protected tableName = 'nitros'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('challenge_id').unsigned()
      table.integer('user_id')
      table.integer('nitro_id')
      table.timestamp('last_claim_nitro')
      table.integer('retry')

      table.unique(['user_id', 'challenge_id'])

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}

import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UserBackends extends BaseSchema {
  protected tableName = 'user_backends'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('role')
      table.string('address').notNullable().index()
      table.string('discord_id')
      table.integer('mecha_own').defaultTo(0)
      table.float('distance').defaultTo(0)
      table.integer('contribution').defaultTo(0)
      table.integer('guild_point').defaultTo(0)
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

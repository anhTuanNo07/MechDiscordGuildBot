import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UserBackends extends BaseSchema {
  protected tableName = 'user_backends'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('role').notNullable()
      table.string('address').notNullable().index()
      table.integer('mecha_own').notNullable()
      table.string('guild_point').notNullable()
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

import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class GuildBackends extends BaseSchema {
  protected tableName = 'guild_backends'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('guild_name').notNullable().unique()
      table.string('guild_tag').notNullable()
      table.string('guild_symbol').notNullable().unique()
      table.text('guild_description')
      table.boolean('access').notNullable()
      table.string('region').notNullable()
      table.string('guild_master').notNullable().unique()
      table.text('members').notNullable()
      table.text('pending_members')

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

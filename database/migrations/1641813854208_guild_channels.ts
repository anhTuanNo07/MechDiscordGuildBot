import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class GuildChannels extends BaseSchema {
  protected tableName = 'guild_channels'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('guild_name').notNullable().unique()
      table.text('guild_id').unique()

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

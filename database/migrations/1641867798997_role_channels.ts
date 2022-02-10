import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class RoleChannels extends BaseSchema {
  protected tableName = 'role_channels'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('role_name').notNullable().unique()
      table.text('role_id').unique()
      table.boolean('generated_role').notNullable()

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

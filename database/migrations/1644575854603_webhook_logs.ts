import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class WebhookLogs extends BaseSchema {
  protected tableName = 'webhook_logs'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('data')
      table.integer('status').defaultTo(0)
      table.string('tx_hash')

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

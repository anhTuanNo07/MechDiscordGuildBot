import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class WebhookLogsAddTxHash extends BaseSchema {
  protected tableName = 'webhook_logs'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tx_hash')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('tx_hash')
    })
  }
}

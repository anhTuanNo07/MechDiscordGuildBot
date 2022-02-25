import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddNitroColumnUserBackends extends BaseSchema {
  protected tableName = 'user_backends'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('nitro_id').notNullable().defaultTo(0)
      table.timestamp('last_claim_nitro')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('nitro_id', 'last_claim_nitro')
    })
  }
}

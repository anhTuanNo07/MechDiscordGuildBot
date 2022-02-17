import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddDistanceToGuildBackends extends BaseSchema {
  protected tableName = 'guild_backends'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('distance')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumns('distance')
    })
  }
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class GuildChannel extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public guildName: string

  @column()
  public guildId: string | null

  @column()
  public guildMaster: string | null

  @column()
  public generatedChannel: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

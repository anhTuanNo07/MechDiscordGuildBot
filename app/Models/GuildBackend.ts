import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class GuildBackend extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public guildName: string

  @column()
  public guildTag: string

  @column()
  public guildSymbol: string

  @column()
  public guildDescription: string | null

  @column()
  public access: boolean

  @column()
  public region: string

  @column()
  public guildMaster: string

  @column()
  public nonce: string | null

  @column()
  public members: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

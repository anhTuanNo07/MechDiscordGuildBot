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
  public guildMaster: string

  @column()
  public members: string

  @column()
  public pendingMembers: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class UserBackend extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public role: string | null

  @column()
  public address: string

  @column()
  public discordId: string | null

  @column()
  public mechaOwn: number | null

  @column()
  public distance: number | null

  @column()
  public contribution: string | null

  @column()
  public guildPoint: string | null

  @column()
  public valid: boolean

  @column()
  public nitroId: number

  @column()
  public lastClaimNitro: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

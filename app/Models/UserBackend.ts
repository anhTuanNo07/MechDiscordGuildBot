import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class UserBackend extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public role: string

  @column()
  public address: string

  @column()
  public discord: string | null

  @column()
  public mechaOwn: number

  @column()
  public distance: string

  @column()
  public contribution: string

  @column()
  public guildPoint: string

  @column()
  public guildMaterials: string

  @column()
  public nitro: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

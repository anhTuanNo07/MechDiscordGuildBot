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
  public mechaOwn: number

  @column()
  public guildPoint: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

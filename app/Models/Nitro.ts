import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Nitro extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public challengeId: number

  @column()
  public userId: number

  @column()
  public nitroId: number

  @column()
  public lastClaimNitro: DateTime

  @column()
  public retry: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

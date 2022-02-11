import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export enum WebhookProcessStatus {
  Created,
  Done,
  Error,
}

export default class WebhookLog extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public data: string

  @column()
  public status: WebhookProcessStatus

  @column()
  public txHash: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class RoleChannel extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public roleName: string

  @column()
  public roleId: string | null

  @column()
  public masterRoleId: string | null

  @column()
  public generatedRole: boolean

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}

import { schema } from '@ioc:Adonis/Core/Validator'

export const userRoleValidator = schema.create({
  userId: schema.string(),
  roleId: schema.string(),
})

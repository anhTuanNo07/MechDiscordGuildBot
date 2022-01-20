import { schema } from '@ioc:Adonis/Core/Validator'

export const userRoleValidator = schema.create({
  userId: schema.string(),
  roleId: schema.string(),
  sig: schema.string.optional(),
  guildId: schema.boolean.optional(),
  nonce: schema.number.optional(),
  deadline: schema.string.optional(),
  signer: schema.string.optional(),
})

import { schema } from '@ioc:Adonis/Core/Validator'

export const verifyUserRequest = schema.create({
  userInformation: schema.string(),
  discriminator: schema.string.optional(),
})

export const roleDataValidator = schema.create({
  name: schema.string(),
  // color string must be the form like 'COLOR_NAME'
  color: schema.string(),
  //  for hierarchically display role
  hoist: schema.boolean.optional(),
  position: schema.number.optional(),
  permissions: schema.array.optional().members(schema.string.optional()),
  mentionable: schema.boolean.optional(),
  icon: schema.string.nullableAndOptional(),
  unicodeEmoji: schema.string.nullableAndOptional(),
  reason: schema.string.optional(),
})

export const roleIdValidator = schema.create({
  id: schema.string(),
})

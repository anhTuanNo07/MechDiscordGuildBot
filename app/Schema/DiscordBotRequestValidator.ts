import { schema } from '@ioc:Adonis/Core/Validator'

export const verifyUserRequest = schema.create({
  userInformation: schema.string(),
  discriminator: schema.string.optional(),
})

export const roleData = schema.create({
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

export const updateRoleData = schema.create({
  // options: schema.object().members({
  name: schema.string.optional(),
  // color string must be the form like 'COLOR_NAME'
  color: schema.string.optional(),
  //  for hierarchically display role
  hoist: schema.boolean.optional(),
  position: schema.number.optional(),
  permissions: schema.array.optional().members(schema.string.optional()),
  mentionable: schema.boolean.optional(),
  icon: schema.string.nullableAndOptional(),
  unicodeEmoji: schema.string.nullableAndOptional(),
  // }),
  reason: schema.string.optional(),
})

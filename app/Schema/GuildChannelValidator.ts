import { schema } from '@ioc:Adonis/Core/Validator'

const createGuildForm = {
  guildName: schema.string(),
}

const updateGuildForm = {
  ...createGuildForm,
  guildId: schema.string(),
}

export const guildValidator = schema.create(createGuildForm)

export const updateGuildValidator = schema.create(updateGuildForm)

export const getGuildValidator = schema.create({
  guildId: schema.string(),
})

import { schema } from '@ioc:Adonis/Core/Validator'

const createGuildBackend = {
  guildName: schema.string(),
  guildTag: schema.string(),
  guildDescription: schema.string.nullableAndOptional(),
  access: schema.boolean(),
  guildMaster: schema.string(),
  members: schema.string.nullableAndOptional(),
  pendingMembers: schema.string.nullableAndOptional(),
}

const updateGuildBackend = {
  id: schema.number(),
  guildName: schema.string(),
  guildTag: schema.string(),
  guildDescription: schema.string.nullableAndOptional(),
  access: schema.boolean(),
  guildMaster: schema.string(),
}

const guildSymbol = {
  guildSymbol: schema.file({
    size: '3mb',
    extnames: ['png'],
  }),
}

const joinGuildBackend = {
  id: schema.number(),
  member: schema.string(),
}

export const guildBackendValidator = schema.create(createGuildBackend)

export const updateGuildBackendValidator = schema.create(updateGuildBackend)

export const guildSymbolValidator = schema.create(guildSymbol)

export const joinGuildValidator = schema.create(joinGuildBackend)

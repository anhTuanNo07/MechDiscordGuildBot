import { schema } from '@ioc:Adonis/Core/Validator'

const createGuildBackend = {
  guildName: schema.string(),
  guildTag: schema.string(),
  guildDescription: schema.string.nullableAndOptional(),
  access: schema.boolean(),
  region: schema.string(),
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
  region: schema.string(),
  guildMaster: schema.string(),
}

const guildSymbol = {
  guildSymbol: schema.file({
    size: '3mb',
    extnames: ['png'],
  }),
}

const guildHome = {
  guildTag: schema.string.nullableAndOptional(),
  region: schema.string.nullableAndOptional(),
}

const joinGuildBackend = {
  id: schema.number(),
  member: schema.string(),
}

const createMemberBackend = {
  role: schema.string(),
  address: schema.string(),
  mechaOwn: schema.number(),
  guildPoint: schema.string(),
}

export const guildBackendValidator = schema.create(createGuildBackend)

export const updateGuildBackendValidator = schema.create(updateGuildBackend)

export const guildSymbolValidator = schema.create(guildSymbol)

export const joinGuildValidator = schema.create(joinGuildBackend)

export const guildHomeValidator = schema.create(guildHome)

export const createMemberValidator = schema.create(createMemberBackend)

import { schema } from '@ioc:Adonis/Core/Validator'

const createGuildBackend = {
  guildName: schema.string(),
  guildTag: schema.string(),
  guildDescription: schema.string.nullableAndOptional(),
  access: schema.boolean(),
  region: schema.string(),
  guildMaster: schema.string(),
  members: schema.string.nullableAndOptional(),
}

const updateGuildBackend = {
  guildId: schema.number(),
  guildName: schema.string(),
  guildTag: schema.string(),
  guildDescription: schema.string.nullableAndOptional(),
  access: schema.boolean(),
  region: schema.string(),
  guildMaster: schema.string(),
  nonce: schema.string.nullable(),
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
  role: schema.string.nullable(),
  address: schema.string(),
  discordId: schema.string.nullable(),
  mechaOwn: schema.number.nullable(),
  distance: schema.string.nullable(),
  contribution: schema.string.nullable(),
  guildPoint: schema.string.nullable(),
  guildMaterials: schema.string.nullable(),
  nitro: schema.string.nullable(),
}

const updateMemberEvent = {
  guildId: schema.string(),
  address: schema.string(),
  inGuild: schema.boolean(),
}

const getUserBackend = {
  address: schema.string.nullableAndOptional(),
  discord: schema.string.nullableAndOptional(),
}

export const guildBackendValidator = schema.create(createGuildBackend)

export const updateGuildBackendValidator = schema.create(updateGuildBackend)

export const guildSymbolValidator = schema.create(guildSymbol)

export const joinGuildValidator = schema.create(joinGuildBackend)

export const guildHomeValidator = schema.create(guildHome)

export const createMemberValidator = schema.create(createMemberBackend)

export const updateMemberEventValidator = schema.create(updateMemberEvent)

export const getUserBackendValidator = schema.create(getUserBackend)

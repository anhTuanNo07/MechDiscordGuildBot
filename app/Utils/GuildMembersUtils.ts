import UserBackend from 'App/Models/UserBackend'
import { GuildMember } from 'discord.js'
import { autoLogin, getGuild } from 'App/Utils/DiscordBotUtils'
import User from 'App/Models/User'
import RoleChannel from 'App/Models/RoleChannel'

// assign role for user on Discord
export async function assignUserRoleOnDiscord(userId: string, roleName: string) {
  // initialize
  const client = await autoLogin()
  const guild = await getGuild(client)

  // update backend information
  const userBackendRecord = await UserBackend.findBy('discord_id', userId)
  if (userBackendRecord) {
    userBackendRecord.role = roleName
    await userBackendRecord.save()
  }
  const userDiscordRecord = await User.findBy('user_id', userId)
  const roleChannel = await RoleChannel.findBy('role_name', roleName)
  if (userDiscordRecord && roleChannel) {
    userDiscordRecord.roleId = roleChannel.roleId
    await userDiscordRecord.save()
  }

  // update discord server
  const member = await guild?.members.fetch(userId)
  const roleId = roleChannel ? (roleChannel.roleId ? roleChannel.roleId : '') : ''
  await member?.roles.add(roleId)
}

// unassign role for user on Discord
export async function unassignUserRoleOnDiscord(userId: string, roleName: string) {
  // initialize
  const client = await autoLogin()
  const guild = await getGuild(client)

  // update backend information
  const userBackendRecord = await UserBackend.findBy('discord_id', userId)
  if (userBackendRecord) {
    userBackendRecord.role = null
    await userBackendRecord.save()
  }
  const userDiscordRecord = await User.findBy('user_id', userId)
  if (userDiscordRecord) {
    userDiscordRecord.roleId = null
    await userDiscordRecord.save()
  }

  // update discord server
  const roleChannel = await RoleChannel.findBy('role_name', roleName)
  const member = await guild?.members.fetch(userId)
  const roleId = roleChannel ? (roleChannel.roleId ? roleChannel.roleId : '') : ''
  await member?.roles.remove(roleId)
}

export function normalizeGuildTag(guildTag: string) {
  return guildTag.toUpperCase()
}

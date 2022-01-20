import { GuildMember } from 'discord.js'
import { autoLogin, getGuild } from 'App/Utils/DiscordBotUtils'
import User from 'App/Models/User'
import RoleChannel from 'App/Models/RoleChannel'

// assign role for user on Discord
export async function assignUserRoleOnDiscord(
  userId: string,
  roleId: string
): Promise<GuildMember | undefined> {
  // initialize
  const client = await autoLogin()
  const guild = await getGuild(client)

  const member = await guild?.members.fetch(userId)
  const roleMember = await member?.roles.add(roleId)
  return roleMember
}

// unassign role for user on Discord
export async function unassignUserRoleOnDiscord(
  userId: string,
  roleId: string
): Promise<GuildMember | undefined> {
  // initialize
  const client = await autoLogin()
  const guild = await getGuild(client)

  const member = await guild?.members.fetch(userId)
  const roleMember = await member?.roles.remove(roleId)
  return roleMember
}

// export async function validateExistUser(userId: string, roleId: string) {
//   const userRecord = await User.findBy('user_id', userId)
//   const roleRecord = await RoleChannel.findBy('role_id', roleId)
//   return userRecord
// }

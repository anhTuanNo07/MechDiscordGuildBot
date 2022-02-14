import Env from '@ioc:Adonis/Core/Env'
import GuildChannel from 'App/Models/GuildChannel'
import RoleChannel from 'App/Models/RoleChannel'
import {
  Client,
  Collection,
  CreateRoleOptions,
  Guild,
  GuildMember,
  Intents,
  Permissions,
  Role,
  RoleData,
  RoleResolvable,
  RoleTagData,
  Snowflake,
} from 'discord.js'

export function fetchRoleData(payload: any): CreateRoleOptions {
  let roleData: CreateRoleOptions = {}
  for (const property in payload) {
    switch (property) {
      case 'name':
        roleData.name = payload['name']
        break
      case 'color':
        roleData.color = payload['color']
        break
      case 'hoist':
        roleData.hoist = payload['hoist']
        break
      case 'position':
        roleData.position = payload['position']
        break
      case 'permissions':
        roleData.permissions = payload['permissions']
        break
      case 'mentionable':
        roleData.mentionable = payload['mentionable']
        break
      case 'icon':
        roleData.icon = payload['icon']
        break
      case 'unicodeEmoji':
        roleData.unicodeEmoji = payload['unicodeEmoji']
        break
      case 'reason':
        roleData.reason = payload['reason']
        break
      default:
        break
    }
  }
  return roleData
}

export function fetchRoleUpdateData(payload: any, roleId: string) {
  const role: RoleResolvable = roleId
  let options = {}
  let roleData: UpdateRoleData = { role, options }
  for (const property in payload) {
    switch (property) {
      case 'name':
        roleData.options.name = payload['name']
        break
      case 'color':
        roleData.options.color = payload['color']
        break
      case 'hoist':
        roleData.options.hoist = payload['hoist']
        break
      case 'position':
        roleData.options.position = payload['position']
        break
      case 'permissions':
        roleData.options.permissions = payload['permissions']
        break
      case 'mentionable':
        roleData.options.mentionable = payload['mentionable']
        break
      case 'icon':
        roleData.options.icon = payload['icon']
        break
      case 'unicodeEmoji':
        roleData.options.unicodeEmoji = payload['unicodeEmoji']
        break
      case 'reason':
        roleData.reason = payload['reason']
        break
      default:
        break
    }
  }
  return roleData
}

export function fetchRoleResponse(role: Role) {
  let dataResponse: RoleDataResponse = {
    color: role.color,
    guild: role.guild,
    hoist: role.hoist,
    id: role.id,
    managed: role.managed,
    mentionable: role.mentionable,
    name: role.name,
    permissions: role.permissions,
    rawPosition: role.rawPosition,
    tags: role.tags,
    icon: role.icon,
    unicodeEmoji: role.unicodeEmoji,
  }
  return dataResponse
}

// Define type of data
interface RoleDataResponse {
  color: number
  guild: Guild
  hoist: boolean
  id: Snowflake
  managed: boolean
  mentionable: boolean
  name: string
  permissions: Readonly<Permissions>
  rawPosition: number
  tags: RoleTagData | null
  icon: string | null
  unicodeEmoji: string | null
}

interface UpdateRoleData {
  role: RoleResolvable
  reason?: string
  options: RoleData
}

// ------------------------------
// --- utils function for bot ---
// ------------------------------

// login for bot
export async function autoLogin(): Promise<Client> {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
  const token = Env.get('BOT_TOKEN')
  await client.login(token)
  return client
}

// retrieve the server information
export async function getGuild(client: Client<boolean>): Promise<Guild | undefined> {
  return client.guilds.cache.get(Env.get('SERVER_ID'))
}

// fetch user
export async function fetchUsername(
  discordQuery: Collection<string, GuildMember> | undefined,
  username: string,
  discriminator: string
): Promise<GuildMember | undefined> {
  if (discordQuery === undefined) {
    return
  }

  let returnValue: undefined | GuildMember

  discordQuery.forEach((value) => {
    if (username === value.user.username && discriminator === value.user.discriminator) {
      returnValue = value
    }
  })
  return returnValue
}

export async function createRole(roleName: string): Promise<string> {
  const client = await autoLogin()
  const guild = await getGuild(client)
  let roleId
  await guild?.roles
    .create({
      name: roleName,
      color: 'AQUA', // consider set default color in env
      permissions: Permissions.FLAGS.VIEW_CHANNEL,
    })
    .then(async (role) => {
      // update roles table
      const roleRecord = await RoleChannel.findBy('role_name', role.name)
      if (roleRecord) {
        roleRecord.roleId = role.id
        await roleRecord.save()
        roleId = role.id
      } else {
        throw new Error(
          'Create role channel error. Please check the roles table for more information.'
        )
      }
      roleId = role.id
    })
  return roleId
}

export async function createChannel(channelName: string, roleId: Snowflake) {
  const client = await autoLogin()
  const guild = await getGuild(client)
  const everyoneRole = Env.get('SERVER_ID')
  await guild?.channels
    .create(channelName, {
      type: 'GUILD_TEXT',
      permissionOverwrites: [
        {
          id: everyoneRole,
          deny: [Permissions.FLAGS.VIEW_CHANNEL],
        },
        {
          id: roleId, // assign role for channel
          allow: [Permissions.FLAGS.VIEW_CHANNEL],
        },
      ],
      reason: 'create guild channel',
    })
    .then(async (channel) => {
      const guild = await GuildChannel.findBy('guild_name', channel.name)
      if (guild) {
        guild.guildId = channel.id
        await guild.save()
      } else {
        throw new Error(
          'Create guild channel error. Please check guilds table for more information'
        )
      }
    })
}

export async function changeRoleName(roleId: string, roleName: string) {
  const client = await autoLogin()
  const guild = await getGuild(client)
  await guild?.roles.edit(roleId, { name: roleName })
}

export async function changeChannelName(channelId: string, channelName: string) {
  const client = await autoLogin()
  const guild = await getGuild(client)
  const channel = await guild?.channels.cache.get(channelId)
  await channel?.edit({ name: channelName })
}

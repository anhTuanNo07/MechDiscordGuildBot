import {
  CreateRoleOptions,
  Guild,
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
  let dataResponse: DataResponse = {
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
interface DataResponse {
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

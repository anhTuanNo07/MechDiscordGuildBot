import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {
  Client,
  Collection,
  Guild,
  GuildMember,
  Intents,
  PermissionResolvable,
  RoleResolvable,
} from 'discord.js'
import Env from '@ioc:Adonis/Core/Env'
import User from 'App/Models/User'
import RoleChannel from 'App/Models/RoleChannel'
import { roleData, updateRoleData, verifyUserRequest } from 'App/Schema/DiscordBotRequestValidator'
import { fetchRoleData, fetchRoleResponse, fetchRoleUpdateData } from 'App/Utils/DiscordBotUtils'

export default class DiscordBotsController {
  // --- Validate user ---
  public async checkValidUser({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: verifyUserRequest,
      data: request.params(),
    })

    // validate request ok
    const userInformation = payload.userInformation
    const discriminator = payload.discriminator
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    if (!guild) {
      response.notFound({
        statusCode: 404,
        message: 'Guild Not Found',
      })
    }
    // Confirm Guild Exist

    let userQuery: GuildMember | undefined

    if (discriminator) {
      // fetch user for param
      try {
        const memberQuery = await guild?.members.search({
          query: userInformation,
        })

        userQuery = await this.fetchUsername(memberQuery, userInformation, discriminator)
      } catch {
        response.unprocessableEntity({
          statusCode: 422,
          message: 'discord server error. please try again',
        })
      }
    } else {
      try {
        userQuery = await guild?.members.fetch(userInformation)
      } catch {
        response.unprocessableEntity({
          statusCode: 422,
          message: 'discord server error. please try again',
        })
      }
    }

    if (!userQuery) {
      response.notFound({
        statusCode: 404,
        message: 'Unknown username',
      })
    }

    const data = {
      userId: userQuery?.user.id,
      username: userQuery?.user.username,
      discriminator: userQuery?.user.discriminator,
    }

    // check user information and save if not in database
    try {
      await User.firstOrCreate(data)
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'create or find user failed',
      })
    }

    // user validation successfully
    response.ok({
      statusCode: 200,
      message: 'valid user',
      data: data,
    })
  }

  // ------------------------------
  // --- Handle about role ---
  // ------------------------------

  public async createNewRole({ request, response }: HttpContextContract) {
    // Input validation
    const payload = await request.validate({
      schema: roleData,
      data: request.body(),
    })
    // fetch data for correct type of discord role
    const roleDataResponse = fetchRoleData(payload)

    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    await guild?.roles
      .create(roleDataResponse)
      .then((role) => {
        const data = fetchRoleResponse(role)
        response.ok({
          statusCode: 200,
          message: 'create role successfully',
          data: data,
        })
      })
      .catch((error) => {
        // Error just about input type of role as its very strict
        response.badRequest({
          statusCode: 400,
          message: error.message,
        })
      })
  }

  public async updateRole({ request, response }: HttpContextContract) {
    // Input validation
    const payload = await request.validate({
      schema: updateRoleData,
      data: request.body(),
    })

    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    // fetch data
    const roleData = fetchRoleUpdateData(payload, request.param('id'))
    const { role, options, reason } = roleData
    if (!options) {
      response.badRequest({
        statusCode: 400,
        message: 'please define carefully options',
      })
      return
    }

    await guild?.roles
      .edit(role, options, reason)
      .then((updated) => {
        const data = fetchRoleResponse(updated)
        response.ok({
          statusCode: 200,
          message: 'update role successfully',
          data: data,
        })
      })
      .catch((error) => {
        // Error just about input type of role as its very strict
        response.badRequest({
          statusCode: 400,
          message: error.message,
        })
      })
  }

  public async getRole({ request, response }: HttpContextContract) {
    const roleId = request.param('id')
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    try {
      const data = await guild?.roles.fetch(roleId)
      response.ok({
        statusCode: 200,
        message: 'get role information successfully.',
        data: {
          roleName: data?.name,
          id: data?.id,
          color: data?.color,
          permission: data?.permissions,
        },
      })
    } catch (error) {
      response.notFound({
        statusCode: 404,
        message: error.message,
      })
    }
    // console.log(data, 'guild data')
  }

  public async deleteRole({ request, response }: HttpContextContract) {
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)
    const roleId = request.param('id')
    try {
      await guild?.roles.delete(roleId, 'Remove unneed role')
      response.ok({
        statusCode: 200,
        message: 'delete successfully.',
      })
    } catch (error) {
      response.badRequest({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  // ------------------------------
  // --- CRUD user-role-assignment ---
  // ------------------------------

  public async assignUserRole({ request, response }: HttpContextContract) {
    const data = request.body()
    const userId = data.userId
    const roleId = data.roleId

    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    try {
      const member = await guild?.members.fetch(userId)
      const roleMember = await member?.roles.add(roleId)
      const roleRecord = await RoleChannel.findBy('role_id', roleId)
      const userRecord = await User.findBy('user_id', userId)
      if (userRecord && roleRecord) {
        userRecord.roleId = roleRecord.id.toString()
        await userRecord.save()
      }
      response.ok({
        statusCode: 200,
        message: 'assign role successfully.',
        data: {
          userId: roleMember?.id,
          username: roleMember?.user.username,
          discriminator: roleMember?.user.discriminator,
          roleId: roleId,
        },
      })
    } catch (error) {
      response.badRequest({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  public async removeUserRole({ request, response }: HttpContextContract) {
    const userId = request.param('userId')
    const roleId = request.all().roleId

    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    try {
      const member = await guild?.members.fetch(userId)
      const roleMember = await member?.roles.remove(roleId)
      response.ok({
        statusCode: 200,
        message: 'remove role successfully.',
        data: {
          userId: roleMember?.id,
          username: roleMember?.user.username,
          discriminator: roleMember?.user.discriminator,
          roleId: roleId,
        },
      })
    } catch (error) {
      console.log(error)
      response.badRequest({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  // --- End handle about role ---

  // ------------------------------
  // --- private function ---
  // ------------------------------

  // login for bot
  private async autoLogin(): Promise<Client> {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    const token = Env.get('BOT_TOKEN')
    await client.login(token)
    return client
  }

  // retrieve the server information
  private async getGuild(client: Client<boolean>): Promise<Guild | undefined> {
    return client.guilds.cache.get(Env.get('SERVER_ID'))
  }

  // fetch user
  private async fetchUsername(
    discordQuery: Collection<string, GuildMember> | undefined,
    username: string,
    discriminator: string
  ): Promise<GuildMember | undefined> {
    if (discordQuery === undefined) {
      return
    }

    let returnValue: undefined | GuildMember = undefined

    discordQuery.forEach((value) => {
      if (username === value.user.username && discriminator === value.user.discriminator) {
        returnValue = value
      }
    })
    return returnValue
  }
}

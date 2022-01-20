import { roleIdValidator } from './../../Schema/DiscordBotRequestValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { GuildMember } from 'discord.js'
import User from 'App/Models/User'
import RoleChannel from 'App/Models/RoleChannel'
import { roleDataValidator, verifyUserRequest } from 'App/Schema/DiscordBotRequestValidator'
import {
  autoLogin,
  fetchRoleData,
  fetchRoleResponse,
  fetchRoleUpdateData,
  fetchUsername,
  getGuild,
} from 'App/Utils/DiscordBotUtils'

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
    const client = await autoLogin()
    const guild = await getGuild(client)

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

        userQuery = await fetchUsername(memberQuery, userInformation, discriminator)
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
      isMaster: false,
    }

    // check user information and save if not in database
    try {
      await User.firstOrCreate(data)
      // user validation successfully
      response.ok({
        statusCode: 200,
        message: 'valid user',
        data: data,
      })
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'create or find user failed',
      })
    }
  }

  // ------------------------------
  // --- Handle about role ---
  // ------------------------------

  public async createNewRole({ request, response }: HttpContextContract) {
    // Input validation
    const payload = await request.validate({
      schema: roleDataValidator,
      data: request.body(),
    })
    // check exist role
    const roleName = payload.name
    const roleRecord = await RoleChannel.findBy('role_name', roleName)
    if (roleRecord) {
      response.methodNotAllowed({
        statusCode: 405,
        message: 'role have existed',
      })
      return
    }

    // fetch data for correct type of discord role
    const roleDataResponse = fetchRoleData(payload)

    const client = await autoLogin()
    const guild = await getGuild(client)

    await guild?.roles
      .create(roleDataResponse)
      .then(async (role) => {
        const data = fetchRoleResponse(role)
        await RoleChannel.create({
          roleName: role.name,
          roleId: role.id,
          generatedRole: true,
        })
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
      schema: roleDataValidator,
      data: request.body(),
    })

    // check exist role
    const roleName = payload.name
    const roleRecord = await RoleChannel.findBy('role_name', roleName)
    if (!roleRecord) {
      response.methodNotAllowed({
        statusCode: 404,
        message: 'role unknown',
      })
      return
    }

    const client = await autoLogin()
    const guild = await getGuild(client)

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
      .then(async (updated) => {
        const data = fetchRoleResponse(updated)
        roleRecord.roleName = updated.name
        await roleRecord.save()
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

  // Update resolve status code
  public async getRole({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: roleIdValidator,
      data: { id: request.param('id') },
    })
    const roleId = payload.id
    const client = await autoLogin()
    const guild = await getGuild(client)

    try {
      const data = await guild?.roles.fetch(roleId)
      if (!data) {
        response.notFound({
          statusCode: 404,
          message: 'Unknown role',
        })
        return
      }
      const responseData = fetchRoleResponse(data)
      response.ok({
        statusCode: 200,
        message: 'get role information successfully.',
        data: responseData,
      })
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'fetch role data error',
      })
    }
  }

  public async deleteRole({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: roleIdValidator,
      data: { id: request.param('id') },
    })

    // check exist role
    const roleId = payload.id
    const roleRecord = await RoleChannel.findBy('role_id', roleId)
    if (!roleRecord) {
      response.methodNotAllowed({
        statusCode: 404,
        message: 'role unknown',
      })
      return
    }

    const client = await autoLogin()
    const guild = await getGuild(client)
    try {
      await guild?.roles.delete(roleId, 'Remove unneeded role')
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
    await roleRecord.delete()
  }
}

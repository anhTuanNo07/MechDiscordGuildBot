import { roleIdValidator } from './../../Schema/DiscordBotRequestValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { GuildMember } from 'discord.js'
import User from 'App/Models/User'
import RoleChannel from 'App/Models/RoleChannel'
import {
  roleDataValidator,
  verifyUserRequest,
  getUserDiscordValidator,
} from 'App/Schema/DiscordBotRequestValidator'
import {
  autoLogin,
  fetchRoleData,
  fetchRoleResponse,
  fetchRoleUpdateData,
  fetchUsername,
  getGuild,
} from 'App/Utils/DiscordBotUtils'
import Database from '@ioc:Adonis/Lucid/Database'

export default class DiscordBotsController {
  // --- Validate user ---
  public async checkValidUser({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: verifyUserRequest,
      data: request.body(),
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
      // check exist on database
      const userRecord = await User.findBy('user_id', data.userId)
      if (userRecord) {
        await userRecord.merge(data).save()
      } else {
        await User.create(data)
      }

      // user validation or update successfully
      response.ok({
        statusCode: 200,
        message: 'validation or update successfully',
        data: data,
      })
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'create or find user failed',
      })
    }
  }

  public async getUser({ request, response }: HttpContextContract) {
    const id = request.param('id')
    if (id) {
      const userRecord = await User.findBy('id', id)
      if (!userRecord) {
        response.notFound({
          statusCode: 404,
          message: 'user unknown',
        })
        return
      }
      response.ok({
        statusCode: 200,
        message: 'successfully',
        data: userRecord,
      })
      return
    }

    // validate filter information
    const filterPayload = await request.validate({
      schema: getUserDiscordValidator,
      data: request.all(),
    })

    // query data
    const username = filterPayload.username ? filterPayload.username : ''
    console.log(filterPayload)
    const userId = filterPayload.userId ? filterPayload.userId : ''

    // query builder with filter for guildTag and region
    const guildRecords = await Database.rawQuery(
      `select * from user where lower(username) like :username and lower(user_id) like :userId`,
      { username: `%${username.toLowerCase()}%`, userId: `%${userId.toLowerCase()}%` }
    )

    response.ok({
      statusCode: 200,
      message: 'successfully',
      data: guildRecords.rows,
    })
  }

  // ------------------------------
  // --- Handle about role ---
  // ------------------------------

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

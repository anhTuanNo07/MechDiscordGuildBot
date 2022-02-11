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
}

import RoleChannel from 'App/Models/RoleChannel'
import {
  getGuildValidator,
  guildValidator,
  updateGuildValidator,
} from './../../Schema/GuildChannelValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GuildChannel from 'App/Models/GuildChannel'
import { verifyCreateGuildSign } from 'App/Utils/BlockChainUtil'

export default class GuildChannelsController {
  public async createGuild({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: guildValidator,
      data: request.body(),
    })

    // check guild exist
    const guildRecord = await GuildChannel.findBy('guild_name', payload.guildName)
    if (guildRecord) {
      response.methodNotAllowed({
        statusCode: 405,
        message: 'guild name exist',
      })
      return
    }

    // validate signature
    const { sig, isPrivate, nonce, deadline, signer } = payload
    const validateSign = verifyCreateGuildSign({
      sig,
      isPrivate,
      nonce,
      deadline,
      signer,
    })

    if (!validateSign) {
      response.unauthorized({
        statusCode: 401,
        message: 'not valid signature',
      })
      return
    }

    try {
      const guildRecord = await GuildChannel.create({
        guildName: payload.guildName,
        generatedChannel: false,
        needUpdate: false,
      })

      await RoleChannel.create({
        roleName: payload.guildName,
        generatedRole: false,
      })

      response.ok({
        statusCode: 200,
        message: 'create new channel successfully',
        data: guildRecord,
      })
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'create new channel failed',
      })
      return
    }
  }

  public async updateGuild({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: updateGuildValidator,
      data: request.body(),
    })

    // check guild exist
    const guildRecord = await GuildChannel.findBy('guild_id', payload.guildId)
    if (!guildRecord) {
      response.notFound({
        statusCode: 404,
        message: 'guild channel unknown',
      })
      return
    }

    try {
      const roleRecord = await RoleChannel.findBy('role_name', payload.guildName)
      if (roleRecord) {
        roleRecord.roleName = payload.guildName
        await roleRecord.save()
      }

      guildRecord.guildName = payload.guildName
      guildRecord.needUpdate = true
      await guildRecord.save()
      response.ok({
        statusCode: 200,
        message: 'update guild channel successfully',
        data: guildRecord,
      })
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'update channel failed',
      })
    }
  }

  public async getGuild({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: getGuildValidator,
      data: request.params,
    })

    // check guild exist
    const guildRecord = await GuildChannel.findBy('guild_id', payload.guildId)
    if (!guildRecord) {
      response.notFound({
        statusCode: 404,
        message: 'guild channel unknown',
      })
      return
    }
    response.ok({
      statusCode: 200,
      message: 'update guild channel successfully',
      data: guildRecord,
    })
  }
}

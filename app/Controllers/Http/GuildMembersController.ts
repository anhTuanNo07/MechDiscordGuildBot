import Database from '@ioc:Adonis/Lucid/Database'
import { signer, signJoinGuild, verifyLinkDiscordWalletSign } from 'App/Utils/BlockChainUtil'
import {
  joinGuildValidator,
  updateMemberValidator,
  getUserBackendValidator,
} from 'App/Schema/GuildBackendValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Event from '@ioc:Adonis/Core/Event'
import UserBackend from 'App/Models/UserBackend'
import { utils } from 'ethers'
export default class GuildBackendsController {
  // --- Guild members ---
  public async joinGuild({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: joinGuildValidator,
      data: request.body(),
    })

    let signature

    try {
      const Signer = signer
      signature = await signJoinGuild(payload.id, payload.member, Signer)
    } catch (error) {
      response.internalServerError({
        statusCode: 500,
        message: 'join guild transaction or sign error',
      })
      return
    }

    // return data
    response.ok({
      statusCode: 200,
      message: 'sign join guild successfully',
      data: signature,
    })
  }

  // CRUD
  public async createMember({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: updateMemberValidator,
      data: request.body(),
    })

    try {
      await UserBackend.create(payload)
    } catch (error) {
      response.internalServerError({
        statusCode: 500,
        message: 'create member failed',
      })
      return
    }

    response.ok({
      statusCode: 200,
      message: 'create member successfully',
    })
  }

  public async updateMemberBackend({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: updateMemberValidator,
      data: request.body(),
    })

    const wallet = utils.getAddress(payload.address)
    if (
      !verifyLinkDiscordWalletSign({
        sig: payload.sig,
        wallet,
        discordId: payload.discordId,
        signer: payload.address,
      })
    ) {
      response.unprocessableEntity({
        statusCode: 422,
        message: 'Invalid signature',
      })
      return
    }

    const existed = await UserBackend.findBy('discord_id', payload.discordId)
    if (existed) {
      response.unprocessableEntity({
        statusCode: 422,
        message: 'Duplicate discord account',
      })
      return
    }

    await UserBackend.updateOrCreate(
      { address: payload.address },
      { address: payload.address, discordId: payload.discordId }
    )

    Event.emit('reload:user', { wallet: payload.address })

    response.ok({
      statusCode: 200,
      message: 'update user successfully',
    })
  }

  public async getMembers({ request, response }: HttpContextContract) {
    const wallet = request.param('wallet')
    if (wallet) {
      const userRecord = await Database.from('user_backends')
        .join('users', 'users.user_id', '=', 'user_backends.discord_id')
        .where('user_backends.address', wallet)
        .select('user_backends.*')
        .select('users.username')
        .select('users.discriminator')
        .first()

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
        data: {
          role: userRecord?.role,
          address: userRecord?.address,
          discord_id: userRecord?.discord_id,
          mecha_own: userRecord?.mecha_own,
          distance: userRecord?.distance,
          contribution: userRecord?.contribution,
          guild_point: userRecord?.guild_point,
          discordAccount: `${userRecord?.username}#${userRecord?.discriminator}`,
        },
      })
      return
    }

    // validate filter information
    const filterPayload = await request.validate({
      schema: getUserBackendValidator,
      data: request.all(),
    })

    // query data
    const address = filterPayload.address ? filterPayload.address : ''
    const discord = filterPayload.discord ? filterPayload.discord : ''

    // query builder with filter for guildTag and region
    const guildRecords = await Database.rawQuery(
      `select * from user_backends where lower(address) like :address and lower(discord) like :discord`,
      { address: `%${address.toLowerCase()}%`, discord: `%${discord.toLowerCase()}%` }
    )

    response.ok({
      statusCode: 200,
      message: 'successfully',
      data: guildRecords.rows,
    })
  }
}

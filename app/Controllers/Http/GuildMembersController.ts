import Database from '@ioc:Adonis/Lucid/Database'
import { signer, signJoinGuild } from 'App/Utils/BlockChainUtil'
import {
  joinGuildValidator,
  createMemberValidator,
  getUserBackendValidator,
} from 'App/Schema/GuildBackendValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UserBackend from 'App/Models/UserBackend'
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
      schema: createMemberValidator,
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
      schema: createMemberValidator,
      data: request.body(),
    })

    const address = payload.address
    const userRecord = await UserBackend.findBy('address', address)
    if (!userRecord) {
      response.notFound({
        statusCode: 404,
        message: 'user unknown',
      })
      return
    }
    await userRecord.merge(payload).save()

    response.ok({
      statusCode: 200,
      message: 'update user successfully',
    })
  }

  public async getMembers({ request, response }: HttpContextContract) {
    const wallet = request.param('wallet')
    if (wallet) {
      const userRecord = await UserBackend.findBy('address', wallet)
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

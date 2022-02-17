import { updateGuildEventValidator } from './../../Schema/GuildBackendValidator'
import {
  changeChannelName,
  changeRoleName,
  createChannel,
  createRole,
} from 'App/Utils/DiscordBotUtils'
import { signer, signCreateGuild, getMechGuildContract, getNonce } from 'App/Utils/BlockChainUtil'
import {
  guildBackendValidator,
  updateGuildBackendValidator,
  guildSymbolValidator,
  guildHomeValidator,
} from 'App/Schema/GuildBackendValidator'
import GuildChannel from 'App/Models/GuildChannel'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GuildBackend from 'App/Models/GuildBackend'
import RoleChannel from 'App/Models/RoleChannel'
export default class GuildBackendsController {
  // --- Guild CRUD ---
  public async createGuild({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: guildBackendValidator,
      data: request.body(),
    })

    let imageFile
    if (request.file('guildSymbol')) {
      imageFile = await request.validate({
        schema: guildSymbolValidator,
        data: request.allFiles(),
      })
    }

    let signature

    // create guild
    try {
      const Signer = signer
      signature = await signCreateGuild(payload.guildMaster, payload.access, Signer)

      //   create guild in backend if sign successfully, update info if create guild on-chain failed
    } catch (error) {
      response.internalServerError({
        statusCode: 500,
        message: 'create guild transaction or sign error',
      })
      return
    }

    // save backend information
    const currentNonce = await getNonce(payload.guildMaster)
    const data = {
      guildName: payload.guildName,
      guildTag: payload.guildTag,
      guildSymbol: `./tmp/uploads/images/${payload.guildName}.png`,
      guildDescription: payload.guildDescription,
      access: payload.access,
      guildMaster: payload.guildMaster,
      region: payload.region,
      members: payload.guildMaster,
      nonce: currentNonce,
    }

    const pendingGuild = await GuildBackend.query()
      .where('guild_master', payload.guildMaster)
      .andWhere('nonce', currentNonce)
      .first()
    if (pendingGuild) {
      await pendingGuild
        .merge({
          guildName: payload.guildName,
          guildTag: payload.guildTag,
          guildSymbol: `./tmp/uploads/images/${payload.guildName}.png`,
          guildDescription: payload.guildDescription,
          access: payload.access,
          guildMaster: payload.guildMaster,
          region: payload.region,
          members: payload.guildMaster,
          nonce: currentNonce,
        })
        .save()
    } else {
      //TODO: check duplicate
      await GuildBackend.create(data)
    }

    // change filename to guildName and save
    if (imageFile) {
      await imageFile.guildSymbol.moveToDisk('images', {
        name: `${payload.guildName}.png`,
      })
    }

    // return data
    response.ok({
      statusCode: 200,
      message: 'sign create guild successfully',
      data: signature,
    })
  }

  public async updateGuildBackend({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: updateGuildBackendValidator,
      data: request.body(),
    })

    const imageFile = await request.validate({
      schema: guildSymbolValidator,
      data: request.allFiles(),
    })

    // update off-chain info
    const guildRecord = await GuildBackend.findBy('guild_id', payload.guildId)

    if (!guildRecord) {
      response.notFound({
        statusCode: 404,
        message: 'guild unknown',
      })
      return
    } else {
      try {
        // update members
        const guildContract = getMechGuildContract()
        const guildId = payload.guildId
        const updateMembers = (await guildContract.getMemberOfGuild(guildId)).toString()
        const updateData = {
          members: updateMembers,
          ...payload,
        }

        // update role name on discord server and backend information
        const roleRecord = await RoleChannel.findBy('role_name', guildRecord.guildName)
        if (roleRecord && roleRecord.roleName !== payload.guildName) {
          const roleId = roleRecord.roleId ? roleRecord.roleId : ''
          await changeRoleName(roleId, payload.guildName)

          await roleRecord
            ?.merge({
              roleName: payload.guildName,
            })
            .save()
        }

        // update channel name on discord server
        const guildChannelRecord = await GuildChannel.findBy('guild_name', guildRecord.guildName)
        if (guildChannelRecord && guildChannelRecord.guildName !== payload.guildName) {
          const guildId = guildChannelRecord.guildId ? guildChannelRecord.guildId : ''
          await changeChannelName(guildId, payload.guildName)

          await guildChannelRecord
            ?.merge({
              guildName: payload.guildName,
            })
            .save()
        }

        // update data in backend

        await guildRecord.merge(updateData).save()
      } catch {
        response.badRequest({
          statusCode: 400,
          message: 'please check update info again',
        })
        return
      }
    }

    // change filename to guildName
    await imageFile.guildSymbol.moveToDisk('images', {
      name: `${payload.guildName}.png`,
    })

    response.ok({
      statusCode: 200,
      message: 'update successfully',
      data: payload,
    })
  }

  public async getGuild({ request, response }: HttpContextContract) {
    const id = request.param('id')
    if (id) {
      const guildRecord = await GuildBackend.findBy('guild_id', id)
      if (!guildRecord) {
        response.notFound({
          statusCode: 404,
          message: 'guild unknown',
        })
        return
      }
      response.ok({
        statusCode: 200,
        message: 'successfully',
        data: {
          guild_id: guildRecord.guildId,
          guild_name: guildRecord.guildName,
          guild_tag: guildRecord.guildTag,
          guild_description: guildRecord.guildDescription,
          is_private: guildRecord.access,
          region: guildRecord.region,
          guild_master: guildRecord.guildMaster,
        },
      })
      return
    }
    // validate filter information
    const filterPayload = await request.validate({
      schema: guildHomeValidator,
      data: request.all(),
    })

    // query data
    const guildTag = filterPayload.guildTag ? filterPayload.guildTag : ''
    const region = filterPayload.region ? filterPayload.region : ''

    // query builder with filter for guildTag and region
    const guildRecords = await GuildBackend.query()
      .whereNotNull('guild_id')
      .orderBy('distance', 'desc')

    response.ok({
      statusCode: 200,
      message: 'successfully',
      data: guildRecords.map((guildRecord) => {
        return {
          guild_id: guildRecord.guildId,
          guild_name: guildRecord.guildName,
          guild_tag: guildRecord.guildTag,
          guild_description: guildRecord.guildDescription,
          distance: guildRecord.distance,
          is_private: guildRecord.access,
          region: guildRecord.region,
          guild_master: guildRecord.guildMaster,
        }
      }),
    })
  }

  // --- End guild CRUD ---
}

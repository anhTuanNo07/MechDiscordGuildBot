import { autoLogin, getGuild } from 'App/Utils/DiscordBotUtils'
import Database from '@ioc:Adonis/Lucid/Database'
import {
  signer,
  signCreateGuild,
  signJoinGuild,
  getMechGuildContract,
  getNonce,
} from 'App/Utils/BlockChainUtil'
import {
  guildBackendValidator,
  updateGuildBackendValidator,
  guildSymbolValidator,
  joinGuildValidator,
  guildHomeValidator,
  createMemberValidator,
  getUserBackendValidator,
} from 'App/Schema/GuildBackendValidator'
import GuildChannel from 'App/Models/GuildChannel'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GuildBackend from 'App/Models/GuildBackend'
import UserBackend from 'App/Models/UserBackend'
import RoleChannel from 'App/Models/RoleChannel'
export default class GuildBackendsController {
  // --- Guild CRUD ---
  public async createGuild({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: guildBackendValidator,
      data: request.body(),
    })

    const imageFile = await request.validate({
      schema: guildSymbolValidator,
      data: request.allFiles(),
    })

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

    // Create role for discord
    const roleData = {
      roleName: payload.guildName,
      generatedRole: false,
    }

    // Create Channel for discord
    const guildData = {
      guildName: payload.guildName,
      generatedChannel: false,
      needUpdate: false,
    }

    // save backend information
    const data = {
      guildName: payload.guildName,
      guildTag: payload.guildTag,
      guildSymbol: `./tmp/uploads/images/${payload.guildName}.png`,
      guildDescription: payload.guildDescription,
      access: payload.access,
      guildMaster: payload.guildMaster,
      members: payload.guildMaster,
      nonce: await getNonce(payload.guildMaster),
    }

    await RoleChannel.create(roleData)
    await GuildChannel.create(guildData)
    await GuildBackend.create(data)

    // change filename to guildName and save
    await imageFile.guildSymbol.moveToDisk('images', {
      name: `${payload.guildName}.png`,
    })

    // return data
    response.ok({
      statusCode: 200,
      message: 'sign create guild successfully',
      data: signature,
    })
  }

  public async updateGuild({ request, response }: HttpContextContract) {
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
    let guildRecord = await GuildBackend.findBy('guild_name', payload.guildName)
    if (!guildRecord) {
      guildRecord = await GuildBackend.findBy('guild_id', payload.guildId)
    }

    if (!guildRecord) {
      response.notFound({
        statusCode: 404,
        message: 'guild unknown',
      })
      return
    } else {
      const roleRecord = await RoleChannel.findBy('role_name', guildRecord.guildName)
      try {
        // update members
        const guildContract = getMechGuildContract()
        const guildId = (await guildContract.users(payload.guildMaster)).guildId.toString()
        const updateMembers = (await guildContract.getMemberOfGuild(guildId)).toString()

        // update pending members
        const pendingMembers = (await guildContract.getPendingMemberOfGuild(guildId)).toString()

        const updateData = {
          members: updateMembers,
          pendingMembers,
          ...payload,
        }

        // update role name on discord server
        if (roleRecord?.generatedRole && roleRecord.roleName !== payload.guildName) {
          const client = await autoLogin()
          const guild = await getGuild(client)
          const roleId = roleRecord.roleId ? roleRecord.roleId : ''
          try {
            await guild?.roles.edit(roleId, { name: payload.guildName })
          } catch (error) {
            response.badRequest({
              statusCode: 400,
              message: error.message,
            })
          }
        }

        // update channel name on discord server
        const guildChannelRecord = await GuildChannel.findBy('guild_name', guildRecord.guildName)
        if (
          guildChannelRecord?.generatedChannel &&
          guildChannelRecord.guildName !== payload.guildName
        ) {
          const client = await autoLogin()
          const guild = await getGuild(client)
          const guildId = guildChannelRecord.guildId ? guildChannelRecord.guildId : ''
          try {
            const channel = await guild?.channels.cache.get(guildId)
            await channel?.edit({ name: payload.guildName })
          } catch (error) {
            response.badRequest({
              statusCode: 400,
              message: error.message,
            })
          }
        }

        // update for role channel and guild channel
        const roleUpdateData = {
          roleName: payload.guildName,
        }
        const guildUpdateData = {
          guildName: payload.guildName,
        }

        // update all data in backend
        await roleRecord?.merge(roleUpdateData).save()
        await guildChannelRecord?.merge(guildUpdateData).save()
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
      const guildRecord = await GuildBackend.findBy('id', id)
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
        data: guildRecord,
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
    console.log(filterPayload)
    const region = filterPayload.region ? filterPayload.region : ''

    // query builder with filter for guildTag and region
    const guildRecords = await Database.rawQuery(
      `select * from guild_backends where lower(guild_tag) like :guildTag and lower(region) like :region`,
      { guildTag: `%${guildTag.toLowerCase()}%`, region: `%${region.toLowerCase()}%` }
    )

    response.ok({
      statusCode: 200,
      message: 'successfully',
      data: guildRecords.rows,
    })
  }

  // --- End guild CRUD ---

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
        message: 'create member faileds',
      })
      return
    }

    response.ok({
      statusCode: 200,
      message: 'create member successfully',
    })
  }

  public async updateMember({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: createMemberValidator,
      data: request.body(),
    })

    const id = request.param('id')
    const userRecord = await UserBackend.findBy('id', id)
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
    const id = request.param('id')
    if (id) {
      const userRecord = await UserBackend.findBy('id', id)
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
    console.log(filterPayload)
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

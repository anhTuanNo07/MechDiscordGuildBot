import {
  signer,
  signCreateGuild,
  signJoinGuild,
  getMechGuildContract,
} from 'App/Utils/BlockChainUtil'
import {
  guildBackendValidator,
  updateGuildBackendValidator,
  guildSymbolValidator,
  joinGuildValidator,
} from 'App/Schema/GuildBackendValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GuildBackend from 'App/Models/GuildBackend'
// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

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

    // save guild symbol

    // change filename to guildName
    await imageFile.guildSymbol.moveToDisk('images', {
      name: `${payload.guildName}.png`,
    })

    // save backend information
    const data = {
      guildName: payload.guildName,
      guildTag: payload.guildTag,
      guildSymbol: `./tmp/uploads/images/${payload.guildName}.png`,
      guildDescription: payload.guildDescription,
      access: payload.access,
      guildMaster: payload.guildMaster,
      members: payload.guildMaster,
    }

    await GuildBackend.create(data)

    // return data
    response.ok({
      statusCode: 200,
      message: 'sign create guild successfully',
      signature: signature,
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
    const guildRecord = await GuildBackend.findBy('id', payload.id)
    if (!guildRecord) {
      response.notFound({
        statusCode: 404,
        message: 'guild unknown',
      })
      return
    } else {
      try {
        guildRecord.guildName = payload.guildName
        guildRecord.guildTag = payload.guildTag
        guildRecord.guildDescription = payload.guildDescription ? payload.guildDescription : ''
        guildRecord.guildMaster = payload.guildMaster
        guildRecord.access = payload.access
        // update members
        const guildContract = getMechGuildContract()
        const guildId = (await guildContract.users(payload.guildMaster)).guildId.toString()
        const updateMembers = (await guildContract.getMembersOfGuild(guildId)).toString()
        guildRecord.members = updateMembers

        // update pending members
        const pendingMembers = (await guildContract.getPendingMemberOfGuild(guildId)).toString()
        guildRecord.pendingMembers = pendingMembers

        await guildRecord.save()
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
    const guildRecords = await GuildBackend.all()
    response.ok({
      statusCode: 200,
      message: 'successfully',
      data: guildRecords,
    })
  }

  // --- End guild CRUD ---

  // --- Guild members CRUD ---
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
      signature: signature,
    })
  }
}

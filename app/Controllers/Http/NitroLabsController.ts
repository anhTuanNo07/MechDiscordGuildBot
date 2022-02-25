import { CraftNitroByLevel } from './../../const/nitroConst'
import Env from '@ioc:Adonis/Core/Env'
import { getMechGuildContract, signClaimNitro, signer } from 'App/Utils/BlockChainUtil'
import { craftNitroValidator, signNitroValidator } from './../../Schema/NitroLabRequestValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UserBackend from 'App/Models/UserBackend'
import { DateTime } from 'luxon'

export default class NitroLabsController {
  public async craftNitro({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: craftNitroValidator,
      data: request.body(),
    })

    // check user in Database
    const Account = await UserBackend.findBy('address', payload.account)
    if (!Account) {
      return response.notFound({
        statusCode: 404,
        message: 'account unknown',
      })
    }

    // check crafting status
    const lastNitroId = Account.nitroId
    if (lastNitroId) {
      return response.ok({
        statusCode: 200,
        message: 'nitro already crafted',
      })
    } else {
      const guildId = (await getMechGuildContract().users(payload.account)).guildId
      const guildLevel = (await getMechGuildContract().guildHalls(guildId)).level
      const CraftNitro = CraftNitroByLevel
      const randomNumber = Math.floor(Math.random() * 101)
      let nitroId
      for (let i = 0; i <= 3; i++) {
        if (
          randomNumber >= CraftNitro[guildLevel.toNumber() - 1][i] &&
          randomNumber <= CraftNitro[guildLevel.toNumber() - 1][i + 1]
        ) {
          console.log(randomNumber)
          nitroId = i + 1
          break
        }
      }
      // assign last nitroId for account
      Account.nitroId = nitroId
      await Account.save()
      return response.ok({
        statusCode: 200,
        message: 'craft nitro successfully',
      })
    }
  }

  public async signNitro({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: signNitroValidator,
      data: request.body(),
    })

    // check user in Database
    const Account = await UserBackend.findBy('address', payload.account)
    if (!Account) {
      return response.notFound({
        statusCode: 404,
        message: 'account unknown',
      })
    }

    // validate enough pending time
    const lastClaimNitro = Account.lastClaimNitro
    if (lastClaimNitro && lastClaimNitro.plus({ days: 1 }) > DateTime.now()) {
      return response.badRequest({
        statusCode: 400,
        message: 'not reach claim moment',
      })
    }

    const amount = 1 // only claim one nitro per one time

    let signature
    // sign claim nitro
    try {
      // update last claim time before sign claim nitro
      Account.lastClaimNitro = DateTime.now()
      await Account.save()
      // sign claim nitro
      const Signer = signer
      signature = await signClaimNitro(
        Env.get('NITRO_ADDRESS'),
        Signer,
        payload.account,
        payload.challenge,
        Account.nitroId,
        amount
      )
    } catch (error) {
      Account.lastClaimNitro = lastClaimNitro
      await Account.save()

      response.internalServerError({
        statusCode: 500,
        message: 'save last claim nitro or sign error',
      })
      return
    }

    // reset nitro id
    Account.nitroId = 0
    await Account.save()

    // return data
    response.ok({
      statusCode: 200,
      message: 'sign claim nitro successfully',
      data: signature,
    })
  }
}

import { getNitroContract } from './../../Utils/BlockChainUtil'
import { CraftNitroByLevel } from './../../const/nitroConst'
import Env from '@ioc:Adonis/Core/Env'
import { getMechGuildContract, signClaimNitro, signer } from 'App/Utils/BlockChainUtil'
import { craftNitroValidator, signNitroValidator } from './../../Schema/NitroLabRequestValidator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UserBackend from 'App/Models/UserBackend'
import Nitro from 'App/Models/Nitro'
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

    // check claim status
    let nitroRecord = await Nitro.query().orderBy('challenge_id', 'desc').first()
    // first time craft
    if (!nitroRecord) {
      nitroRecord = await Nitro.create({
        challengeId: Env.get('START_CHALLENGE_ID'),
        userId: Account.id,
        nitroId: await this.generateRandomNitroId(payload.account),
        retry: 0,
      })
      return response.ok({
        statusCode: 200,
        message: 'craft nitro successfully',
      })
    }

    // check claimed
    const isClaimed = await getNitroContract().accountClaimedReward(
      payload.account,
      nitroRecord.challengeId
    )
    if (!isClaimed) {
      return response.ok({
        statusCode: 200,
        message: 'Nitro already crafted',
      })
    }
    // nitro claimed and craft another nitro
    await Nitro.create({
      challengeId: nitroRecord.challengeId + 1,
      userId: Account.id,
      nitroId: await this.generateRandomNitroId(payload.account),
      retry: 0,
    })

    return response.ok({
      statusCode: 200,
      message: 'craft nitro successfully',
    })
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
    let nitroRecord = await Nitro.query().orderBy('challenge_id', 'desc').first()
    const lastCraftNitro = nitroRecord?.createdAt
    if (lastCraftNitro && lastCraftNitro.plus({ days: 1 }) > DateTime.now()) {
      return response.badRequest({
        statusCode: 400,
        message: 'not reach claim moment',
      })
    }

    const amount = 1 // only claim one nitro per one time

    let signature
    // sign claim nitro
    if (nitroRecord) {
      try {
        // update last claim time before sign claim nitro
        nitroRecord.lastClaimNitro = DateTime.now()
        nitroRecord.retry = nitroRecord.retry + 1
        await nitroRecord.save()
        // sign claim nitro
        const Signer = signer
        signature = await signClaimNitro(
          Env.get('NITRO_ADDRESS'),
          Signer,
          payload.account,
          1,
          nitroRecord.nitroId,
          amount
        )
      } catch (error) {
        response.internalServerError({
          statusCode: 500,
          message: 'save last claim nitro or sign error',
        })
        return
      }
    }

    // return data
    response.ok({
      statusCode: 200,
      message: 'sign claim nitro successfully',
      data: {
        signature,
        nitroId: nitroRecord?.nitroId,
        challengeId: nitroRecord?.challengeId,
        retry: nitroRecord?.retry,
      },
    })
  }

  // generate random nitro id with probability based on guild hall level
  private async generateRandomNitroId(account: string): Promise<number> {
    const guildId = (await getMechGuildContract().users(account)).guildId
    const guildLevel = (await getMechGuildContract().guildHalls(guildId)).level
    const CraftNitro = CraftNitroByLevel
    const randomNumber = Math.floor(Math.random() * 101)
    let nitroId = 0
    for (let i = 0; i <= 3; i++) {
      if (
        randomNumber >= CraftNitro[guildLevel.toNumber() - 1][i] &&
        randomNumber <= CraftNitro[guildLevel.toNumber() - 1][i + 1]
      ) {
        nitroId = i + 1
      }
    }
    return nitroId
  }
}

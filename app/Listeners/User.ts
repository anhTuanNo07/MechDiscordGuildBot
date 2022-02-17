import Env from '@ioc:Adonis/Core/Env'
import { EventsList } from '@ioc:Adonis/Core/Event'
import UserBackend from 'App/Models/UserBackend'
import { gql, GraphQLClient } from 'graphql-request'
import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import Logger from '@ioc:Adonis/Core/Logger'

const graphQLClient = new GraphQLClient(Env.get('GRAPH_ENDPOINT'))
const moonRaceAPI = Env.get('MOONRACE_API')

const LIST_OWNED_MECHA = gql`
  query ListOwnedMecha($owner: String) {
    tokens(where: { ownerActual: $owner }, first: 1000) {
      tokenID
    }
  }
`

export default class User {
  public async onReload(payload: EventsList['reload:user']) {
    if (!payload.wallet) return

    Logger.info('Reloading race data', payload.wallet)
    try {
      await User.reloadRaceData(payload)
    } catch (err) {
      Logger.error(`Reload race data fail for ${payload.wallet}`, err)
    }
    Logger.info('Reloaded race data', payload.wallet)
  }

  public static async reloadRaceData(payload: { wallet: string }): Promise<number> {
    const wallet = payload.wallet
    const { tokens: ownedData } = await graphQLClient.request(LIST_OWNED_MECHA, {
      owner: wallet.toLowerCase(),
    })

    const count = ownedData?.length
    if (!count) {
      const user = await UserBackend.findBy('address', wallet)
      if (!user) {
        throw new Error(`Can't find user record`)
      }

      await user.merge({ mechaOwn: count, distance: 0 }).save()
      return 0
    }

    const params = new URLSearchParams()
    params.set(
      'mechaIds',
      ownedData.map((mecha) => mecha.tokenID)
    )

    const { data: raceData } = await fetch(`${moonRaceAPI}/api/leaderboards?${params}`).then(
      (resp) => resp.json()
    )
    const userDistance = raceData.reduce((prev, cur) => {
      return prev + cur?.distance
    }, 0)

    const user = await UserBackend.findBy('address', wallet)
    if (!user) {
      throw new Error(`Can't find user record`)
    }

    await user.merge({ mechaOwn: count, distance: Math.floor(userDistance) }).save()
    return Math.floor(userDistance)
  }
}

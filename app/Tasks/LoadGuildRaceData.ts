import Env from '@ioc:Adonis/Core/Env'
import { BaseTask } from 'adonis5-scheduler/build'
import GuildBackend from 'App/Models/GuildBackend'
import { MechGuild } from 'Types/MechGuild'
import MechGuildAbi from 'Abis/MechGuild.json'
import { ethers } from 'ethers'
import UserListener from 'App/Listeners/User'

import Logger from '@ioc:Adonis/Core/Logger'

const readOnlyProvider = new ethers.providers.JsonRpcProvider(Env.get('NETWORK_URL'))
const mechGuildContract = new ethers.Contract(
  Env.get('MECH_GUILD_CONTRACT'),
  MechGuildAbi,
  readOnlyProvider
) as MechGuild

export default class LoadGuildRaceData extends BaseTask {
  public static get schedule() {
    return '0 * * * * *'
  }
  /**
   * Set enable use .lock file for block run retry task
   * Lock file save to `build/tmpTaskLock`
   */
  public static get useLock() {
    return false
  }

  public async handle() {
    Logger.info('Reloading race data for guilds')
    const guildRecords = await GuildBackend.query().whereNotNull('guild_id')
    for (let i = 0; i < guildRecords.length; i++) {
      const guildId = guildRecords[i].guildId
      const members = await mechGuildContract.getMemberOfGuild(guildId)

      let totalDistance = 0
      for (const mem of members) {
        try {
          const distance = await UserListener.reloadRaceData({ wallet: mem })
          totalDistance += distance
        } catch {
          continue
        }
      }
      const guild = await GuildBackend.findBy('guild_id', guildId)
      if (!guild) {
        throw new Error(`Can't find guild record`)
      }

      await guild.merge({ distance: Math.floor(totalDistance) }).save()
    }
  }
}

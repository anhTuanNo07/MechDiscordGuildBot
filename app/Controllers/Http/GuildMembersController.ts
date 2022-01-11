import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import {
  Client,
  Collection,
  Guild,
  GuildMember,
  Intents,
  PermissionResolvable,
  RoleResolvable,
} from 'discord.js'
import GuildChannel from 'App/Models/GuildChannel'
import RoleChannel from 'App/Models/RoleChannel'
// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class GuildMembersController {
  public async updateGuildMember({ request, response }: HttpContextContract) {
    const userId = request.param('id')
    const param = request.body()
    const guildName = param.guildName
    const guildMaster = param.guildMaster
    console.log(userId, 'userId')

    const user = await User.findBy('user_id', userId)
    if (user) {
      // update guild

      const guild = await GuildChannel.findBy('guild_name', guildName)
      if (!guild) {
        await GuildChannel.create({
          guildName: guildName,
          generatedChannel: false,
        })
      } else {
        //update user information
        user.guildId = guild.id
        await user.save()
        //update guildMember information
        if (guildMaster) {
          guild.guildMaster = user.userId
          await guild.save()
        }
      }

      // update role
      // const role = await RoleChannel.firstOrCreate({
      //   roleName: guildName,
      //   generatedRole: false,
      // })
      const role = await RoleChannel.findBy('role_name', guildName)
      if (!role) {
        await RoleChannel.create({
          roleName: guildName,
          generatedRole: false,
        })
      }

      response.ok({
        statusCode: 200,
        message: 'update guild member information successfully',
      })
    } else {
      response.notFound({
        statusCode: 400,
        message: 'user not found',
      })
    }
  }

  public async disableChannel({ request, response }: HttpContextContract) {
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)
    const channelId = request.param('channelId')
    const everyoneRole = await guild?.roles.everyone.id
    // guild?.channels.
  }

  // --- private function ---

  // login for bot
  private async autoLogin(): Promise<Client> {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    const token = Env.get('BOT_TOKEN')
    await client.login(token)
    return client
  }

  // retrieve the server information
  private async getGuild(client: Client<boolean>): Promise<Guild | undefined> {
    return client.guilds.cache.get(Env.get('SERVER_ID'))
  }

  // fetch user
  private async fetchUsername(
    discordQuery: Collection<string, GuildMember> | undefined,
    username: string,
    discriminator: string
  ): Promise<GuildMember | undefined> {
    if (discordQuery === undefined) {
      return
    }

    let returnValue: undefined | GuildMember = undefined

    discordQuery.forEach((value) => {
      if (username === value.user.username && discriminator === value.user.discriminator) {
        returnValue = value
      }
    })
    return returnValue
  }
}

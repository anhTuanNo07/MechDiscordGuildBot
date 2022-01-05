import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Client, Intents } from 'discord.js'
import Env from '@ioc:Adonis/Core/Env'

export default class DiscordBotsController {
  public async login({ response }: HttpContextContract) {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    const token = Env.get('BOT_TOKEN')
    await client.login(token)
    return response.ok({
      statusCode: 200,
      message: 'guild bot login successfully',
    })
  }
}

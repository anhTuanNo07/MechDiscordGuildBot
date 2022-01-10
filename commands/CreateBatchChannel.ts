import Env from '@ioc:Adonis/Core/Env'
import { Client, Intents } from 'discord.js'
import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class CreateBatchChannel extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'create:batch_channel'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'auto create batch channel on discord'

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  }

  public async run() {
    // Preparation

    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    this.logger.info('The client is ready.')
    const token = Env.get('BOT_TOKEN')
    await client.login(token)
    this.logger.info('Discord bot login successfully.')

    // Create batch of channel

    // Connect to guild
    const guild = client.guilds.cache.get(Env.get('SERVER_ID'))
    if (!guild) {
      this.logger.fatal('Guild not found')
      return
    }
    for (let i = 0; i <= 3; i++) {
      await guild.channels
        .create(`Channel thứ ${i}`, {
          reason: 'Need a channel for guild',
        })
        .then((channel) => console.log(channel))
    }
  }
}

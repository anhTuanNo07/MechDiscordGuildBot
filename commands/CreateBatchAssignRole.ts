import Env from '@ioc:Adonis/Core/Env'
import { Client, Intents, Permissions } from 'discord.js'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
import GuildChannel from 'App/Models/GuildChannel'

export default class CreateBatchAssignRole extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'create:batch_assign_role'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'create batch for assign role for user'

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

    // create batch of assign role

    // Connect to guild
    const guild = client.guilds.cache.get(Env.get('SERVER_ID'))
    if (!guild) {
      this.logger.fatal('Guild not found')
      return
    }

    // Start trace the user information
  }
}

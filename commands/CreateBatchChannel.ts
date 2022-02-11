import Env from '@ioc:Adonis/Core/Env'
import { Client, Intents, Permissions } from 'discord.js'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
import GuildChannel from 'App/Models/GuildChannel'

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

    this.logger.info(`Start creating channel...`)
    await client.login(token)
    const guildObject = client.guilds.cache.get(Env.get('SERVER_ID'))
    // console.log(guildObject, 'object')
    const everyoneRole = await guildObject?.roles.everyone.id
    console.log(everyoneRole, '@everyone')

    // start generating guild channels
    const guildStack = await Database.query()
      .from('guild_channels')
      .where('generated_channel', 'false')

    if (!guildStack.length) {
      this.logger.fatal('All guild channels are created!')
      return
    }

    await Promise.all(
      guildStack.map(async (guildRecord) => {
        await guild.channels
          .create(guildRecord.guild_name, {
            permissionOverwrites: [
              {
                id: everyoneRole ? everyoneRole : Env.get('EVERYONE_ROLE'),
                allow: [Permissions.FLAGS.VIEW_CHANNEL],
              },
            ],
            reason: 'create batch of guild channel',
          })
          .then(async (channel) => {
            // set private for @everyone

            // // console.log(everyoneRole, 'everyoneRole')
            // if (everyoneRole) {
            //   channel.permissionOverwrites.set([
            //     {
            //       id: everyoneRole,
            //       deny: [Permissions.FLAGS.VIEW_CHANNEL],
            //     },
            //   ])
            // }

            // update guilds table
            const guild = await GuildChannel.findBy('guild_name', channel.name)
            if (guild) {
              guild.guildId = channel.id
              await guild.save()
              this.logger.info(`Create guild channel '${channel.name}' successfully.`)
            } else {
              throw new Error(
                'Create guild channel error. Please check guilds table for more information'
              )
            }
          })
          .catch((error) => this.logger.error(error.message))
      })
    )
    this.logger.info('Create guilds successfully!')
  }
}

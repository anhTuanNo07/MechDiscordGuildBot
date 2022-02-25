import Env from '@ioc:Adonis/Core/Env'
import { Client, Intents, Permissions } from 'discord.js'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
import GuildChannel from 'App/Models/GuildChannel'

export default class DeleteBatchChannel extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'delete:batch_channel'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'auto delete batch channel (for test only)'

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
    // for (let i = 0; i <= 3; i++) {
    //   await guild.channels
    //     .create(`Channel thứ ${i}`, {
    //       reason: 'Need a channel for guild',
    //     })
    //     .then((channel) => console.log(channel))
    // }
    this.logger.info(`Start deleting channel...`)
    await client.login(token)
    const guildObject = client.guilds.cache.get(Env.get('SERVER_ID'))
    // console.log(guildObject, 'object')
    const everyoneRole = await guildObject?.roles.everyone.id
    console.log(everyoneRole, '@everyone')

    // start generating guild channels
    const guildStack = await Database.query()
      .from('guild_channels')
      .where('generated_channel', 'true')

    // console.log(guildStack, 'guild stack -----------------')

    if (!guildStack.length) {
      this.logger.fatal('All created guild channels are deleted!')
      return
    }

    await Promise.all(
      guildStack.map(async (guildRecord) => {
        const channel = await guild.channels.cache.get(guildRecord.guild_id)
        if (channel) {
          await channel
            .delete()
            .then(async (channel) => {
              // update guilds table
              const guild = await GuildChannel.findBy('guild_name', channel.name)
              if (guild) {
                guild.guildId = null
                await guild.save()
                this.logger.info(`Delete guild channel '${channel.name}' successfully.`)
              } else {
                throw new Error(
                  'Delete guild channel error. Please check guilds table for more information'
                )
              }
            })
            .catch((error) => this.logger.error(error.message))
        }
      })
    )
    this.logger.info('Delete guilds successfully!')
  }
}

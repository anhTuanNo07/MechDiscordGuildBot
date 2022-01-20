import Env from '@ioc:Adonis/Core/Env'
import { Client, Intents, Permissions } from 'discord.js'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
import GuildChannel from 'App/Models/GuildChannel'
import RoleChannel from 'App/Models/RoleChannel'

export default class CreateBatchRole extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'create:batch_role'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'auto create batch role on DISCORD'

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

    // Create batch of role channel

    // Connect to guild
    const guild = client.guilds.cache.get(Env.get('SERVER_ID'))
    if (!guild) {
      this.logger.fatal('Guild not found')
      return
    }

    this.logger.info(`Start creating role channel...`)

    const roleStack = await Database.query().from('role_channels').where('generated_role', 'false')
    if (!roleStack.length) {
      this.logger.fatal('All role channels are created!')
      return
    }

    await Promise.all(
      roleStack.map(async (roleRecord) => {
        // create role
        await guild.roles
          .create({
            name: roleRecord.role_name,
            color: 'AQUA',
            permissions: Permissions.FLAGS.VIEW_CHANNEL,
          })
          .then(
            // fet the role for the suitable channel
            async (role) => {
              const channelRecord = await GuildChannel.findBy('guild_name', role.name)
              if (channelRecord && channelRecord.guildId) {
                const channel = await guild.channels.fetch(channelRecord.guildId)
                await channel?.permissionOverwrites.create(role.id, { VIEW_CHANNEL: true })
              }

              // update roles table
              const roleRecord = await RoleChannel.findBy('role_name', role.name)
              if (roleRecord) {
                roleRecord.roleId = role.id
                roleRecord.generatedRole = true
                await roleRecord.save()
                this.logger.info(`Create role channel '${role.name}' successfully.`)
              } else {
                throw new Error(
                  'Create role channel error. Please check the roles table for more information.'
                )
              }
            }
          )
          .catch((error) => this.logger.error(error.message))

        // create master role
        // ---
        // Create more role for guild master, but the mechanism is conducted via smart contract
        // So this function will be commented for reuse
        // await guild.roles
        //   .create({
        //     name: roleRecord.role_name,
        //     color: 'DARK_RED',
        //     permissions: Permissions.FLAGS.MANAGE_CHANNELS,
        //   })
        //   .then(
        //     // fet the role for the suitable channel
        //     async (role) => {
        //       const channelRecord = await GuildChannel.findBy('guild_name', role.name)
        //       if (channelRecord && channelRecord.guildId) {
        //         const channel = await guild.channels.fetch(channelRecord.guildId)
        //         await channel?.permissionOverwrites.create(role.id, { MANAGE_CHANNELS: true })
        //       }

        //       // update roles table
        //       const roleRecord = await RoleChannel.findBy('role_name', role.name)
        //       if (roleRecord) {
        //         roleRecord.masterRoleId = role.id
        //         roleRecord.generatedRole = true
        //         await roleRecord.save()
        //         this.logger.info(`Create master role channel '${role.name}' successfully.`)
        //       } else {
        //         throw new Error(
        //           'Create role channel error. Please check the roles table for more information.'
        //         )
        //       }
        //     }
        //   )
        //   .catch((error) => this.logger.error(error.message))
      })
    )
    this.logger.info('Create roles successfully!')
  }
}

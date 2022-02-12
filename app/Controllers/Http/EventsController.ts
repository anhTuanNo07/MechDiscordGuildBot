import { assignUserRoleOnDiscord, unassignUserRoleOnDiscord } from 'App/Utils/GuildMembersUtils'
import {
  WebhookEvent,
  GuildCreatedData,
  JoinedData,
  GuildMasterChangedData,
  OutOfGuildData,
} from './../../../types/local.d'
import { WebhookProcessStatus } from './../../Models/WebhookLog'
import { UnifiedWebhookEvent } from './../../../types/local'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import UserBackend from 'App/Models/UserBackend'
import GuildBackend from 'App/Models/GuildBackend'
import WebhookLog from 'App/Models/WebhookLog'
import RoleChannel from 'App/Models/RoleChannel'
import GuildChannel from 'App/Models/GuildChannel'
import { createChannel, createRole } from 'App/Utils/DiscordBotUtils'

export default class EventsController {
  public async processEvent({ request, response, logger }: HttpContextContract) {
    logger.info(`[Webhook] - ${JSON.stringify(request.all())}`)

    const data = request.only([
      'event',
      'params',
      'txHash',
      'blockNumber',
      'blockTime',
      'txIndex',
      'from',
      'to',
    ]) as UnifiedWebhookEvent

    let webhookLog = await WebhookLog.findBy('txHash', data.txHash)
    if (webhookLog) {
      logger.info(`This event has already been processed! ${JSON.stringify(data)}`)

      return response.ok({
        message: 'processed',
      })
    }
    webhookLog = await WebhookLog.create({
      data: JSON.stringify(data),
      txHash: data.txHash,
    })

    switch (data.event) {
      case 'GuildCreated':
        await this.handleGuildCreated(data)
        break

      case 'GuildMasterChanged':
        await this.handleGuildMasterChanged(data)
        break

      case 'Joined':
        await this.handleJoined(data)
        break

      case 'OutOfGuild':
        await this.handleOutOfGuild(data)
        break

      default:
        return response.badRequest({
          message: 'Unknown event',
        })
    }

    webhookLog.status = WebhookProcessStatus.Done
    await webhookLog.save()

    return response.ok({
      statusCode: 200,
      message: 'OK',
    })
  }

  private async handleGuildCreated(data: WebhookEvent<'GuildCreated', GuildCreatedData>) {
    const { params } = data

    const nonce = params.sigNonce
    const guildRecord = await GuildBackend.query()
      .where('guild_master', params.guildMaster)
      .andWhere('nonce', nonce)
      .first()
    await guildRecord
      ?.merge({
        guildId: params.guildId,
        guildMaster: params.guildMaster,
        access: params.bool,
        nonce: params.sigNonce,
      })
      .save()
    const guildName = guildRecord ? guildRecord.guildName : ''
    await RoleChannel.create({ roleName: guildName })
    await GuildChannel.create({ guildName: guildName })

    // INTERACT WITH DISCORD SERVER
    // create channel and role
    const roleId = await createRole(guildName)
    await createChannel(guildName, roleId)
  }

  private async handleGuildMasterChanged(
    data: WebhookEvent<'GuildMasterChanged', GuildMasterChangedData>
  ) {
    const { params } = data

    const guildRecord = await GuildBackend.query().where('guild_id', params.guildId).first()
    await guildRecord
      ?.merge({
        guildId: params.guildId,
        guildMaster: params.newMaster,
      })
      .save()
  }

  private async handleJoined(data: WebhookEvent<'Joined', JoinedData>) {
    const { params } = data

    const userRecord = await UserBackend.findBy('address', params.memberAddress)

    const guildRecord = await GuildChannel.findBy('guild_id', params.guildId)

    if (!userRecord || !guildRecord) {
      throw new Error('invalid input data')
    } else {
      // member join guild, need to assign role
      await assignUserRoleOnDiscord(
        userRecord.discordId ? userRecord.discordId : '',
        guildRecord.guildName
      )
    }
  }

  private async handleOutOfGuild(data: WebhookEvent<'OutOfGuild', OutOfGuildData>) {
    const { params } = data

    const userRecord = await UserBackend.findBy('address', params.memberAddress)

    const guildRecord = await GuildChannel.findBy('guild_id', params.guildId)

    if (!userRecord || !guildRecord) {
      throw new Error('invalid input data')
    } else {
      // member out of guild, need to unassign role
      await unassignUserRoleOnDiscord(
        userRecord.discordId ? userRecord.discordId : '',
        guildRecord.guildName
      )
    }
  }
}

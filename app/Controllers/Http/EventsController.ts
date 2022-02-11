import { WebhookProcessStatus } from './../../Models/WebhookLog'
import { UnifiedWebhookEvent } from './../../../types/local'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import WebhookLog from 'App/Models/WebhookLog'

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
        await this.handleGuildCreated()
        break

      case 'Joined':
        await this.handleJoined()
        break

      default:
        return response.badRequest({
          message: 'Unknown event',
        })
    }

    webhookLog.status = WebhookProcessStatus.Done
    await webhookLog.save()

    return response.ok({
      message: 'OK',
    })
  }

  private async handleGuildCreated() {}
  private handleJoined() {}
}

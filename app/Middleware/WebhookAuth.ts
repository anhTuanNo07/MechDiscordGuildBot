import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class WebhookAuth {
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes from here...
    const webhookTokenFromReq = request.header('WebhookToken')
    const webhookToken = Env.get('WEBHOOK_API_TOKEN')
    if (!webhookToken || webhookToken !== webhookTokenFromReq) {
      return response.unauthorized({
        message: 'Access denied',
      })
    }
    // pass middleware
    await next()
  }
}

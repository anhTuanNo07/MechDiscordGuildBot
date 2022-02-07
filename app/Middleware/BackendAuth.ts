import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class BackendAuth {
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes from here...
    const backendTokenFromReq = request.header('BackendToken')
    const backendToken = Env.get('BACKEND_API_TOKEN')
    if (!backendToken || backendToken !== backendTokenFromReq) {
      return response.unauthorized({
        message: 'Access denied',
      })
    }
    // pass middleware
    await next()
  }
}

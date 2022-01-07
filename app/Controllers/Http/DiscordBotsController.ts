import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Client, Intents, PermissionResolvable, RoleResolvable } from 'discord.js'
import Env from '@ioc:Adonis/Core/Env'

export default class DiscordBotsController {
  public async login({ response }: HttpContextContract) {
    await this.autoLogin()
    return response.ok({
      statusCode: 200,
      message: 'guild bot login successfully',
    })
  }

  public async checkValidUser({ request, response }: HttpContextContract) {
    const userId = request.param('id')
    const client = await this.autoLogin()
    const guild = client.guilds.cache.get(Env.get('SERVER_ID'))

    if (!guild) {
      response.ok({
        statusCode: 404,
        message: 'Guild Not Found',
      })
    }

    // Confirm Guild Exist
    try {
      const member = await guild?.members.fetch(userId)

      response.ok({
        statusCode: 200,
        message: 'valid user',
        data: {
          username: member?.user.username,
          discriminator: member?.user.discriminator,
        },
      })
    } catch (error) {
      const message = error.message

      response.badRequest({
        statusCode: 400,
        message: message,
      })
    }
  }

  public async createNewRole({ request, response }: HttpContextContract) {
    const roleName = request.body().roleName
    const permission: PermissionResolvable = request.body().permission

    const client = await this.autoLogin()

    // Create Role
    const guild = client.guilds.cache.get(Env.get('SERVER_ID'))
    await guild?.roles
      .create({
        name: roleName,
        color: 'BLUE',
        reason: 'Create role for guild master',
        permissions: permission,
      })
      .then((role) => {
        response.ok({
          statusCode: 200,
          message: 'create role successfully',
          data: {
            roleId: role.id,
            roleName: role.name,
          },
        })
      })
      .catch((error) => {
        response.badRequest({
          statusCode: 400,
          message: error.message,
        })
      })
  }

  public async updateRole({ request, response }: HttpContextContract) {
    const client = await this.autoLogin()
    const guild = client.guilds.cache.get(Env.get('SERVER_ID'))
    const params: any = request.body()
    const role: RoleResolvable = request.param('id')
    console.log(role, 'role id')

    await guild?.roles
      .edit(role, {
        name: params.name,
        color: params.color,
        permissions: params.permissions,
      })
      .then((updated) => console.log(`Edited role name to ${updated.name}`))
      .catch(console.error)
  }
  // private function
  private async autoLogin(): Promise<Client> {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    const token = Env.get('BOT_TOKEN')
    await client.login(token)
    return client
  }
}

import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Client, Guild, Intents, PermissionResolvable, RoleResolvable } from 'discord.js'
import Env from '@ioc:Adonis/Core/Env'

export default class DiscordBotsController {
  public async login({ response }: HttpContextContract) {
    await this.autoLogin()
    return response.ok({
      statusCode: 200,
      message: 'guild bot login successfully',
    })
  }

  // Check user exist in the server

  public async checkValidUser({ request, response }: HttpContextContract) {
    const userId = request.param('id')
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

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

  // --- Handle about role ---

  public async createNewRole({ request, response }: HttpContextContract) {
    const roleName = request.body().roleName
    const permission: PermissionResolvable = request.body().permission
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

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
    const guild = await this.getGuild(client)
    const params: any = request.body()
    const role: RoleResolvable = request.param('id')

    await guild?.roles
      .edit(role, {
        name: params.name,
        color: params.color,
        permissions: params.permissions,
      })
      .then((updated) => console.log(`Edited role name to ${updated.name}`))
      .catch(console.error)
  }

  public async getRole({ request, response }: HttpContextContract) {
    const roleId = request.param('id')
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    try {
      const data = await guild?.roles.fetch(roleId)
      response.ok({
        statusCode: 200,
        message: 'get role infor successfully.',
        data: {
          roleName: data?.name,
          id: data?.id,
          color: data?.color,
          permission: data?.permissions,
        },
      })
    } catch (error) {
      response.notFound({
        statusCode: 404,
        message: error.message,
      })
    }
    // console.log(data, 'guild data')
  }

  public async deleteRole({ request, response }: HttpContextContract) {
    const client = await this.autoLogin()
    const guild = await this.getGuild(client)
    const roleId = request.param('id')
    try {
      await guild?.roles.delete(roleId, 'Remove unneed role')
      response.ok({
        statusCode: 200,
        message: 'delete successfully.',
      })
    } catch (error) {
      response.badRequest({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  // CRUD user-role
  public async assignUserRole({ request, response }: HttpContextContract) {
    const data = request.body()
    const userId = data.userId
    const roleId = data.roleId

    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    try {
      const member = await guild?.members.fetch(userId)
      const roleMember = await member?.roles.add(roleId)
      response.ok({
        statusCode: 200,
        message: 'assign role successfully.',
        data: {
          userId: roleMember?.id,
          username: roleMember?.user.username,
          discriminator: roleMember?.user.discriminator,
          roleId: roleId,
        },
      })
    } catch (error) {
      response.badRequest({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  public async removeUserRole({ request, response }: HttpContextContract) {
    const userId = request.param('userId')
    const roleId = request.all().roleId

    const client = await this.autoLogin()
    const guild = await this.getGuild(client)

    try {
      const member = await guild?.members.fetch(userId)
      const roleMember = await member?.roles.remove(roleId)
      response.ok({
        statusCode: 200,
        message: 'remove role successfully.',
        data: {
          userId: roleMember?.id,
          username: roleMember?.user.username,
          discriminator: roleMember?.user.discriminator,
          roleId: roleId,
        },
      })
    } catch (error) {
      console.log(error)
      response.badRequest({
        statusCode: 400,
        message: error.message,
      })
    }
  }

  // --- End handle about role ---

  // private function
  // login for bot
  private async autoLogin(): Promise<Client> {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] })
    const token = Env.get('BOT_TOKEN')
    await client.login(token)
    return client
  }

  // retrieve the server information
  private async getGuild(client: Client<boolean>): Promise<Guild | undefined> {
    return client.guilds.cache.get(Env.get('SERVER_ID'))
  }
}

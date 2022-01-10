import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class GuildMembersController {
  public async updateGuildMember({ request, response }: HttpContextContract) {
    const userId = request.param('id')
    const param = request.body()
    const guildName = param.guildName
    const guildMaster = param.guildMaster
    console.log(userId, 'userId')

    const user = await User.findBy('user_id', userId)
    if (user) {
      user.guildMaster = guildMaster
      user.guildName = guildName
      await user.save()
      response.ok({
        statusCode: 200,
        message: 'update guild member infor successfully',
      })
    } else {
      response.notFound({
        statusCode: 400,
        message: 'user not found',
      })
    }
  }
}

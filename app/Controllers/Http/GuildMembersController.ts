import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import RoleChannel from 'App/Models/RoleChannel'
import { userRoleValidator } from 'App/Schema/UserRoleValidator'
import { assignUserRoleOnDiscord, unassignUserRoleOnDiscord } from 'App/Utils/GuildMembersUtils'

export default class GuildMembersController {
  // ------------------------------
  // --- CRUD user-role-assign  ---
  // ------------------------------

  public async assignUserRole({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: userRoleValidator,
      data: request.body(),
    })
    const userId = payload.userId
    const roleId = payload.roleId
    // validate exist user
    const userRecord = await User.findBy('user_id', userId)
    if (!userRecord) {
      response.notFound({
        statusCode: 404,
        message: 'user unknown',
      })
      return
    }

    // validate exist role
    const roleRecord = await RoleChannel.findBy('role_id', roleId)
    if (!roleRecord) {
      response.notFound({
        statusCode: 404,
        message: 'role unknown',
      })
      return
    }

    // validate user has had a certain role
    if (userRecord.roleId) {
      await unassignUserRoleOnDiscord(userId, roleId)
    }

    try {
      const roleMember = await assignUserRoleOnDiscord(userId, roleId)
      const roleRecord = await RoleChannel.findBy('role_id', roleId)
      const userRecord = await User.findBy('user_id', userId)
      if (userRecord && roleRecord) {
        userRecord.roleId = roleRecord.id.toString()
        await userRecord.save()
      }
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
    } catch {
      response.internalServerError({
        statusCode: 500,
        message: 'update on discord or db erupt ',
      })
    }
  }

  public async removeUserRole({ request, response }: HttpContextContract) {
    // validate input data
    const payload = await request.validate({
      schema: userRoleValidator,
      data: request.body(),
    })
    const userId = payload.userId
    const roleId = payload.roleId

    // validate exist user
    const userRecord = await User.findBy('user_id', userId)
    if (!userRecord) {
      response.notFound({
        statusCode: 404,
        message: 'user unknown',
      })
      return
    }

    // validate exist role
    const roleRecord = await RoleChannel.findBy('role_id', roleId)
    if (!roleRecord) {
      response.notFound({
        statusCode: 404,
        message: 'role unknown',
      })
      return
    }

    try {
      const roleMember = await unassignUserRoleOnDiscord(userId, roleId)
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
    } catch {
      response.internalServerError({
        statusCode: 400,
        message: 'remove role on discord or server error',
      })
    }
    userRecord.roleId = null
    await userRecord.save()
  }
  // --- End handle about assign role for user ---

  // TO_DO_______
  // This function is modified for guild master
  // But the guild master role is partially controlled on smart contract
  // So this function is left by the comment for reuse

  // public async updateGuildMember({ request, response }: HttpContextContract) {
  //   const userId = request.param('id')
  //   const param = request.body()
  //   const guildName = param.guildName
  //   const guildMaster = param.guildMaster
  //   console.log(userId, 'userId')

  //   const user = await User.findBy('user_id', userId)
  //   if (user) {
  //     // update guild

  //     const guild = await GuildChannel.findBy('guild_name', guildName)
  //     if (!guild) {
  //       await GuildChannel.create({
  //         guildName: guildName,
  //         generatedChannel: false,
  //       })
  //     } else {
  //       //update user information
  //       user.guildId = guild.id
  //       await user.save()
  //       //update guildMember information
  //       if (guildMaster) {
  //         guild.guildMaster = user.userId
  //         await guild.save()
  //       }
  //     }

  //     // update role
  //     // const role = await RoleChannel.firstOrCreate({
  //     //   roleName: guildName,
  //     //   generatedRole: false,
  //     // })
  //     const role = await RoleChannel.findBy('role_name', guildName)
  //     if (!role) {
  //       await RoleChannel.create({
  //         roleName: guildName,
  //         generatedRole: false,
  //       })
  //     }

  //     response.ok({
  //       statusCode: 200,
  //       message: 'update guild member information successfully',
  //     })
  //   } else {
  //     response.notFound({
  //       statusCode: 400,
  //       message: 'user not found',
  //     })
  //   }
  // }
}

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  // --- Check valid user ---
  // userInformation can be the username if pass with discriminator or userId
  Route.get('verify/:userInformation/:discriminator?', 'DiscordBotsController.checkValidUser')

  // --- Role CRUD ---
  Route.get('role/:id', 'DiscordBotsController.getRole')
  Route.post('role', 'DiscordBotsController.createNewRole')
  Route.patch('role/:id', 'DiscordBotsController.updateRole')
  Route.delete('role/:id', 'DiscordBotsController.deleteRole')

  // --- Assign role for user ---
  Route.post('user-role', 'GuildMembersController.assignUserRole')
  Route.delete('user-role', 'GuildMembersController.removeUserRole')

  // --- GuildMember ---
  // special strong for assign master guild
  Route.patch('user/:id', 'GuildMembersController.updateGuildMember')

  // --- GuildManager ---
  Route.post('guild', 'GuildChannelsController.createGuild')
  Route.patch('guild/:guildId', 'GuildChannelsController.updateGuild')
  Route.get('guild/:guildId', 'GuildChannelsController.getGuild')
  // Cannot delete guild as information on blockchain is uncertainty
})
  .prefix('api/discord')
  .middleware('webhookAuth')

Route.group(() => {
  // --- guild backend CRUD ---
  Route.post('guild', 'GuildBackendsController.createGuild')
  Route.patch('guild/:id', 'GuildBackendsController.updateGuild')
  Route.get('guild/:id?', 'GuildBackendsController.getGuild')
  // Cannot delete guild as information on blockchain is uncertainty

  // --- guild member backend ---

  // sign member join guild
  Route.post('join', 'GuildBackendsController.joinGuild')
  // member CRUD
  Route.post('member', 'GuildBackendsController.createMember')
  Route.patch('member/:id', 'GuildBackendsController.updateMember')
  Route.get('member/:id?', 'GuildBackendsController.getMembers')
  // no need to have delete member
}).prefix('api/backend')

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

Route.group(() => {
  // --- guild webhook ---
  Route.patch('guild/:id', 'GuildChannelsController.updateGuildEvent')
  // Cannot delete guild as information on blockchain is uncertainty

  // --- member webhook ---
  Route.post('member', 'GuildMembersController.updateMemberEvent')
  // no need to have delete member
})
  .prefix('api/webhook')
  .middleware('webhookAuth')

Route.group(() => {
  Route.post('verify', 'DiscordBotsController.checkValidUser')
  // --- guild backend CRUD ---
  Route.post('guild', 'GuildChannelsController.createGuild')
  Route.patch('guild/:id', 'GuildChannelsController.updateGuildBackend')
  Route.get('guild/:id?', 'GuildChannelsController.getGuild')
  // Cannot delete guild as information on blockchain is uncertainty
  // --- guild member backend ---

  // sign member join guild
  Route.post('join', 'GuildMembersController.joinGuild')
  // member CRUD
  Route.post('member', 'GuildMembersController.createMember')
  Route.patch('member/:id', 'GuildMembersController.updateMemberBackend')
  Route.get('member/:id?', 'GuildMembersController.getMembers')
  // no need to have delete member
}).prefix('api/backend')

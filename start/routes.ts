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
  // Updating...
  Route.post('user-role', 'DiscordBotsController.assignUserRole')
  Route.delete('user-role/:userId', 'DiscordBotController.removeUserRole')

  // --- GuildMember ---
  // Updating...
  Route.patch('add-member/:id', 'GuildMembersController.updateGuildMember')

  // --- GuildManager ---
  // Updating...
  Route.post('disable-channel/:channelId', 'GuildMembersController.disableChannel')
}).prefix('api/discord')

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
  Route.get('bot/login', 'DiscordBotsController.login')
  // Check valid user
  Route.get('check-valid-user/:id', 'DiscordBotsController.checkValidUser')
  // Role CRUD
  Route.get('role/:id', 'DiscordBotsController.getRole')
  Route.post('role/create', 'DiscordBotsController.createNewRole')
  Route.patch('role/:id', 'DiscordBotsController.updateRole')
  Route.delete('role/:id', 'DiscordBotsController.deleteRole')
  // Assign role for user
  Route.post('user-role/create', 'DiscordBotsController.assignUserRole')
  Route.delete('user-role/:userId', 'DiscordBotscontroller.removeUserRole')
}).prefix('api/discord')

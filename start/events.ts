/*
|--------------------------------------------------------------------------
| Preloaded File
|--------------------------------------------------------------------------
|
| Any code written inside this file will be executed during the application
| boot.
|
*/
import Event from '@ioc:Adonis/Core/Event'

declare module '@ioc:Adonis/Core/Event' {
  interface EventsList {
    'reload:user': { wallet: string }
  }
}

Event.on('reload:user', 'User.onReload')

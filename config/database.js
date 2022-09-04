'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Default Connection
  |--------------------------------------------------------------------------
  |
  | Connection defines the default connection settings to be used while
  | interacting with SQL databases.
  |
  */
  connection: Env.get('DB_CONNECTION'),

  production: {
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', '34.87.116.196'),
      port: Env.get('DB_PORT', '3306'),
      user: Env.get('DB_USER', 'adonis'),
      password: Env.get('DB_PASSWORD', 'Matchday-01'),
      database: Env.get('DB_DATABASE', 'adonis_db')
    },
    debug: Env.get('DB_DEBUG', false)
  },
  dev: {
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', '35.240.144.87'),
      port: Env.get('DB_PORT', '3306'),
      user: Env.get('DB_USER', 'adonis'),
      password: Env.get('DB_PASSWORD', 'Matchday-01'),
      database: Env.get('DB_DATABASE', 'adonis_db')
    },
    debug: Env.get('DB_DEBUG', false)
  },
  trainer_production: {
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', '34.87.116.196'),
      port: Env.get('DB_PORT', '3306'),
      user: Env.get('DB_USER', 'adonis'),
      password: Env.get('DB_PASSWORD', 'Matchday-01'),
      database: Env.get('DB_DATABASE', 'new_schema')
    },
    debug: Env.get('DB_DEBUG', false)
  },

}

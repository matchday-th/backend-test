'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserCredentialSchema extends Schema {
  up () {
    this.create('user_credentials', (table) => {
      table.increments()
      table.integer('user_id').notNullable()
      table.string('auth_type').notNullable()
      table.string('auth_id').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('user_credentials')
  }
}

module.exports = UserCredentialSchema

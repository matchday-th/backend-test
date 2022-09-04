'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserUuidSchema extends Schema {
  up () {
    this.create('user_uuids', (table) => {
      table.increments()
      table.string('uuid').notNull()
      table.integer('user_id').notNull()
      table.boolean('is_login').defaultTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('user_uuids')
  }
}

module.exports = UserUuidSchema

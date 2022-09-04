'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RoomSchema extends Schema {
  up () {
    this.create('rooms', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('match_id').notNullable()
      table.integer('user_id')
      table.boolean('accept').defaultTo(false)
      table.string('description').defaultTo('')
      table.timestamps()
    })
  }

  down () {
    this.drop('rooms')
  }
}

module.exports = RoomSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FriendSchema extends Schema {
  up () {
    this.create('friends', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('user_id').notNullable()
      table.integer('friend_id').notNullable()
      table.boolean('accept').defaultTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('friends')
  }
}

module.exports = FriendSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ReadMessageSchema extends Schema {
  up () {
    this.create('read_messages', (table) => {
      table.increments()
      table.integer('chat_id').notNullable()
      table.integer('user_id').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('read_messages')
  }
}

module.exports = ReadMessageSchema

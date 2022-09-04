'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StackSchema extends Schema {
  up () {
    this.create('stacks', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('user_id')
      table.integer('provider_id')
      table.timestamps()
    })
  }

  down () {
    this.drop('stacks')
  }
}

module.exports = StackSchema

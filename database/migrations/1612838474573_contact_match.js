'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContactMatchSchema extends Schema {
  up () {
    this.create('contact_matches', (table) => {
      table.increments()
      table.integer('match_id')
      table.integer('stack_id')
      table.string('name').notNullable()
      table.string('phone_number').notNullable()
    })
  }

  down () {
    this.drop('contact_matches')
  }
}

module.exports = ContactMatchSchema

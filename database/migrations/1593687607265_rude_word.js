'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RudeWordSchema extends Schema {
  up () {
    this.create('rude_words', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('setting_id').defaultTo(1)
      table.string('word').notNullable()
    })
  }

  down () {
    this.drop('rude_words')
  }
}

module.exports = RudeWordSchema

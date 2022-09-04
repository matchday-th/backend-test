'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CourtSchema extends Schema {
  up () {
    this.create('courts', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('court_type_id').notNullable()
      table.integer('price').notNullable()
      table.string('image')
      table.string('name').notNullable()
    })
  }

  down () {
    this.drop('courts')
  }
}

module.exports = CourtSchema

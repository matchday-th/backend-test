'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FacilitySchema extends Schema {
  up () {
    this.create('facilities', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.string('name').notNullable()
      table.string('name2')
      table.string('icon')
    })
  }

  down () {
    this.drop('facilities')
  }
}

module.exports = FacilitySchema

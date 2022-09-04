'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CourtTypeFixedTimeSchema extends Schema {
  up () {
    this.create('court_type_fixed_times', (table) => {
      table.increments()
      table.integer('court_type_id').notNullable()
      table.string('days').notNullable()
      table.string('time_start').notNullable()
      table.string('time_end').notNullable()
    })
  }

  down () {
    this.drop('court_type_fixed_times')
  }
}

module.exports = CourtTypeFixedTimeSchema

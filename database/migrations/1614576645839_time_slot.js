'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TimeSlotSchema extends Schema {
  up () {
    this.create('time_slots', (table) => {
      table.increments()
      table.integer('court_type_id').notNullable()
      table.string('days').notNullable()
      table.string('open_time').notNullable()
      table.string('close_time').notNullable()
    })
  }

  down () {
    this.drop('time_slots')
  }
}

module.exports = TimeSlotSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BusTimeSchema extends Schema {
  up () {
    this.create('bus_times', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_sport_id').notNullable()
      table.string('days').notNullable()
      table.string('open_time').notNullable()
      table.string('close_time').notNullable()
    })
  }

  down () {
    this.drop('bus_times')
  }
}

module.exports = BusTimeSchema

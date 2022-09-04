'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProviderSportSchema extends Schema {
  up () {
    this.create('provider_sports', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_id').notNullable()
      table.integer('sport_id').notNullable()
      table.string('calendar_view')
    })
  }

  down () {
    this.drop('provider_sports')
  }
}

module.exports = ProviderSportSchema

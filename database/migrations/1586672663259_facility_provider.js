'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FacilityProviderSchema extends Schema {
  up () {
    this.create('facility_providers', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_id').notNullable()
      table.integer('facility_id').notNullable()
      table.string('detail')
    })
  }

  down () {
    this.drop('facility_providers')
  }
}

module.exports = FacilityProviderSchema

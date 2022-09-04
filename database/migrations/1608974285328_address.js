'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddressSchema extends Schema {
  up () {
    this.create('addresses', (table) => {
      table.increments()
      table.integer('provider_id').notNullable()
      table.string('name')
      table.string('number')
      table.string('alley')
      table.string('road')
      table.string('subdistrict')
      table.string('district')
      table.string('province')
      table.string('postcode')
      table.string('country').defaultTo('Thailand')
      table.timestamps()
    })
  }

  down () {
    this.drop('addresses')
  }
}

module.exports = AddressSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OptionPriceSchema extends Schema {
  up () {
    this.create('option_prices', (table) => {
      table.increments()
      table.integer('provider_id').notNullable()
      table.string('name')
      table.integer('price')
    })
  }

  down () {
    this.drop('option_prices')
  }
}

module.exports = OptionPriceSchema

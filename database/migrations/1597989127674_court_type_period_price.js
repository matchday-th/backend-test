'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CourtTypePeriodPriceSchema extends Schema {
  up () {
    this.create('court_type_period_prices', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('court_type_id').notNullable()
      table.integer('period_price_id').notNullable()
    })
  }

  down () {
    this.drop('court_type_period_prices')
  }
}

module.exports = CourtTypePeriodPriceSchema

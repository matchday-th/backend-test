'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PeriodPriceSchema extends Schema {
  up () {
    this.create('period_prices', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.string('days').notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.boolean('var_type').defaultTo(false)
      table.integer('var_price')
    })
  }

  down () {
    this.drop('period_prices')
  }
}

module.exports = PeriodPriceSchema

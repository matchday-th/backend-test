'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SlotPriceSchema extends Schema {
  up () {
    this.create('slot_prices', (table) => {
      table.increments()
      table.integer('slot_price_id').notNullable()
      table.string('start_time').notNullable()
      table.string('end_time').notNullable()
      table.integer('var_price').notNullable()
      table.boolean('percent').defaultTo(false)
    })
  }

  down () {
    this.drop('slot_prices')
  }
}

module.exports = SlotPriceSchema

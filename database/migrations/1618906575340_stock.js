'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StockSchema extends Schema {
  up () {
    this.create('stocks', (table) => {
      table.increments()
      table.integer('provider_id').notNullable()
      table.string('name').notNullable()
      table.string('price').notNullable()
      table.string('icon')
      table.boolean('inventory').defaultTo(false)
      table.integer('amount').defaultTo(0)
    })
  }

  down () {
    this.drop('stocks')
  }
}

module.exports = StockSchema

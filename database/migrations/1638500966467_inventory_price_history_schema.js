'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InventoryPriceHistorySchema extends Schema {
  up () {
    this.create('inventory_price_histories', (table) => {
      table.increments()
      table.integer('inventory_history_id')
      table.integer('price')
    })
  }

  down () {
    this.drop('inventory_price_histories')
  }
}

module.exports = InventoryPriceHistorySchema

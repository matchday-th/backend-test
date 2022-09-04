'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InventoryHistorySchema extends Schema {
  up () {
    this.create('inventory_histories', (table) => {
      table.increments()
      table.integer('inventory_id').notNull()
      table.integer('staff_id')
      table.integer('user_id')
      table.integer('status').notNull()
      table.integer('refill')
      table.timestamps()
    })
  }

  down () {
    this.drop('inventory_histories')
  }
}

module.exports = InventoryHistorySchema

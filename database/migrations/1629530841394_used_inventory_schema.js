'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsedInventorySchema extends Schema {
  up () {
    this.create('used_inventories', (table) => {
      table.increments()
      table.integer('inventory_id')
      table.integer('match_id')
      table.integer('price')
      table.integer('amount')
      table.timestamps()
    })
  }

  down () {
    this.drop('used_inventories')
  }
}

module.exports = UsedInventorySchema

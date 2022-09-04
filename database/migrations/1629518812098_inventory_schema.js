'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InventorySchema extends Schema {
  up () {
    this.create('inventories', (table) => {
      table.increments()
      table.integer('provider_id').notNull()
      table.string('name').notNull()
      table.integer('price').notNull()
      table.boolean('cancle').defaultTo(false)
    })
  }

  down () {
    this.drop('inventories')
  }
}

module.exports = InventorySchema

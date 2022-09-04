'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ReceiptsSchema extends Schema {
  up () {
    this.create('receipts', (table) => {
      table.increments()
      table.string('used_inventory_ids')
      table.string('username')
      table.datetime('created_at')
    })
  }

  down () {
    this.drop('receipts')
  }
}

module.exports = ReceiptsSchema

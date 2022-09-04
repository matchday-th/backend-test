'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PosPaymentSchema extends Schema {
  up () {
    this.create('pos_payments', (table) => {
      table.increments()
      table.integer('receipt_id')
      table.integer('used_inventory_id')
      table.integer('paid_amount').defaultTo(0)
      table.string('payment_status') //online || offline
      table.timestamps()
    })
  }

  down () {
    this.drop('pos_payments')
  }
}

module.exports = PosPaymentSchema

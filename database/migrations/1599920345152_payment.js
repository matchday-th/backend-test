'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentSchema extends Schema {
  up () {
    this.create('payments', (table) => {
      table.increments()
      table.string('refno')
      table.string('productdetail')
      table.string('cardtype')
      table.string('total')
      table.string('customeremail')
      table.string('merchantid')
      table.integer('match_id')
      table.integer('user_id')
      table.timestamps()
    })
  }

  down () {
    this.drop('payments')
  }
}

module.exports = PaymentSchema

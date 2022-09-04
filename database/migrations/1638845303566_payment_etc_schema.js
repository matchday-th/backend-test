'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentEtcSchema extends Schema {
  up () {
    this.create('payment_etcs', (table) => {
      table.increments()
      table.integer('provider_id')
      table.string('name')
      table.integer('amount')
      table.integer('price')
      table.timestamps()
    })
  }

  down () {
    this.drop('payment_etcs')
  }
}

module.exports = PaymentEtcSchema

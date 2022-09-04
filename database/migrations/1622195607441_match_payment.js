'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MatchPaymentSchema extends Schema {
  up () {
    this.create('match_payments', (table) => {
      table.increments()
      table.integer('match_id')
      table.integer('payment_id')
    })
  }

  down () {
    this.drop('match_payments')
  }
}

module.exports = MatchPaymentSchema

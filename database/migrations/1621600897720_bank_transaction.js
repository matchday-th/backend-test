'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BankTransactionSchema extends Schema {
  up () {
    this.create('bank_transactions', (table) => {
      table.increments()
      table.integer('user_id')
      table.string('bank')
      table.string('refno')
      table.integer('amount')
      table.timestamps()
    })
  }

  down () {
    this.drop('bank_transactions')
  }
}

module.exports = BankTransactionSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ArenaLedgerTransactionSchema extends Schema {
  up () {
    this.create('arena_ledger_transactions', (table) => {
      table.increments()
      table.integer('arena_ledger_id').notNullable()
      table.string('bank').notNullable()
      table.string('refno').notNullable()
      table.decimal('amount').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('arena_ledger_transactions')
  }
}

module.exports = ArenaLedgerTransactionSchema

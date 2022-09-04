'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ArenaLedgerSchema extends Schema {
  up () {
    this.create('arena_ledgers', (table) => {
      table.increments()
      table.integer('provider_id').notNullable()
      table.integer('week').notNullable()
      table.string('date').notNullable()
      table.decimal('revenue').notNullable()
      table.decimal('paid_online').notNullable()
      table.decimal('paid_cash').notNullable()
      table.decimal('fee').notNullable()
      table.decimal('pending_revenue').notNullable()
    })
  }

  down () {
    this.drop('arena_ledgers')
  }
}

module.exports = ArenaLedgerSchema

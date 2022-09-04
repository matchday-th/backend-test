'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MatchStockSchema extends Schema {
  up () {
    this.create('match_stocks', (table) => {
      table.increments()
      table.integer('match_id')
      table.integer('stock_id')
      table.integer('amount')
    })
  }

  down () {
    this.drop('match_stocks')
  }
}

module.exports = MatchStockSchema

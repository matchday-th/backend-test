'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScoreBoardSchema extends Schema {
  up () {
    this.create('score_boards', (table) => {
      table.increments()
      table.integer('provider_id').notNull()
      table.integer('prize').defaultTo(0)
      table.string('at_month')
    })
  }

  down () {
    this.drop('score_boards')
  }
}

module.exports = ScoreBoardSchema

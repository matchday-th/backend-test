'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ScoreBoardSettingSchema extends Schema {
  up () {
    this.create('score_board_settings', (table) => {
      table.increments()
      table.integer('total_prize').defaultTo(0)
      table.integer('payment_method').defaultTo(0)
      table.string('banned_sp')
      table.string('at_month')
      table.integer('limit').defaultTo(20)
    })
  }

  down () {
    this.drop('score_board_settings')
  }
}

module.exports = ScoreBoardSettingSchema

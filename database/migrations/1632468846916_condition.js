'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConditionSchema extends Schema {
  up () {
    this.create('conditions', (table) => {
      table.increments()
      table.integer('active_provider_ids')
      table.integer('active_user_ids')
      table.integer('active_sport_ids')
      table.string('active_products')
      table.boolean('first_buy')
      table.integer('max_reduction')
    })
  }

  down () {
    this.drop('conditions')
  }
}

module.exports = ConditionSchema

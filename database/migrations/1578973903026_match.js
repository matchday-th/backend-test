'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MatchSchema extends Schema {
  up () {
    this.create('matches', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('user_id')
      table.datetime('time_start',[5]).notNullable()
      table.datetime('time_end',[5])
      table.boolean('room_switch').defaultTo(false)
      table.string('description').defaultTo('')
      table.integer('court_id').notNullable()
      table.integer('total_price').notNullable()
      table.integer('preference_id')
      table.integer('call_confirm').defaultTo(0)
      table.integer('service_id')
      table.integer('promotion_id')
      table.boolean('cancel').defaultTo(false)
      table.boolean('check-in').defaultTo(false)
      table.integer('stack_id')
      table.integer('paid_amount').defaultTo(0)
      table.string('payment').defaultTo('cash')
      table.timestamps()
    })
  }

  down () {
    this.drop('matches')
  }
}

module.exports = MatchSchema

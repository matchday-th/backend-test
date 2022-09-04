'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PosSubscriptionSchema extends Schema {
  up () {
    this.create('pos_subscriptions', (table) => {
      table.increments()
      table.integer('provider_id')
      table.boolean('actived',false)
      table.datetime('end_date',[5])
    })
  }

  down () {
    this.drop('pos_subscriptions')
  }
}

module.exports = PosSubscriptionSchema

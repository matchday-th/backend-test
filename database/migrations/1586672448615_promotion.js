'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PromotionSchema extends Schema {
  up () {
    this.create('promotions', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_id')
      table.string('name').notNullable()
      table.integer('reward_price')
      table.string('type').notNullable()
      table.integer('value').notNullable()
      table.datetime('expire_start').notNullable()
      table.datetime('expire_end').notNullable()
      table.integer('total_use').notNullable()
      table.integer('user_limit').notNullable()
      table.string('image')
      table.timestamps()
    })
  }

  down () {
    this.drop('promotions')
  }
}

module.exports = PromotionSchema

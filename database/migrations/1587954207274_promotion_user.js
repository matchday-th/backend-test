'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PromotionUserSchema extends Schema {
  up () {
    this.create('promotion_users', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('promotion_id')
      table.integer('user_id')
      table.integer('remain')
      table.timestamps()
    })
  }

  down () {
    this.drop('promotion_users')
  }
}

module.exports = PromotionUserSchema

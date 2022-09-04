'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConditionPromotionSchema extends Schema {
  up () {
    this.create('condition_promotions', (table) => {
      table.increments()
      table.integer('condition_id')
      table.integer('promotion_id')
    })
  }

  down () {
    this.drop('condition_promotions')
  }
}

module.exports = ConditionPromotionSchema

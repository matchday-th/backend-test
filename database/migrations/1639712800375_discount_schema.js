'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DiscountSchema extends Schema {
  up () {
    this.create('discounts', (table) => {
      table.increments()
      table.string('name')
      table.string('percents')
      table.timestamps()
    })
  }

  down () {
    this.drop('discounts')
  }
}

module.exports = DiscountSchema

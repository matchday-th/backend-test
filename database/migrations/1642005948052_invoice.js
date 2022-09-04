'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvoiceSchema extends Schema {
  up () {
    this.create('invoices', (table) => {
      table.increments()
      table.integer('pos_subscription_id')
      table.integer('provider_id')
      table.string('product_detail')
      table.datetime('start_date',[5]).notNullable()
      table.datetime('end_date',[5]).notNullable()
    })
  }

  down () {
    this.drop('invoices')
  }
}

module.exports = InvoiceSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BundleSchema extends Schema {
  up () {
    this.create('bundles', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_id').notNullable()
      table.integer('provider_sport_id')
      table.string('name').notNullable()
      table.string('base_code').notNullable()
      table.string('image')
      table.integer('price').notNullable()
      table.integer('price_original').notNullable()
      table.integer('code_limits').notNullable()
      table.string('serving_days').defaultTo(30)
      table.string('serving_window')
      table.string('serving_dow')
      table.timestamps()
    })
  }

  down () {
    this.drop('bundles')
  }
}

module.exports = BundleSchema

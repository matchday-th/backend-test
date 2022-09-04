'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ServiceSchema extends Schema {
  up () {
    this.create('services', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_sport_id').notNullable()
      table.string('name').notNullable()
      table.string('price').notNullable()
      table.string('icon')
      table.integer('limit').defaultTo(0)
    })
  }

  down () {
    this.drop('services')
  }
}

module.exports = ServiceSchema

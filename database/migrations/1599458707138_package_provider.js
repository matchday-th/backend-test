'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PackageProviderSchema extends Schema {
  up () {
    this.create('package_providers', (table) => {
      table.increments()
      table.integer('package_id').defaultTo(1)
      table.datetime('start_date').notNullable()
      table.datetime('expire_date').notNullable()
      table.integer('provider_id').notNullable()
    })
  }

  down () {
    this.drop('package_providers')
  }
}

module.exports = PackageProviderSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsedBundleSchema extends Schema {
  up () {
    this.create('used_bundles', (table) => {
      table.increments()
      table.integer('asset_bundle_id').notNullable()
      table.integer('match_id')
      table.integer('provider_id').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('used_bundles')
  }
}

module.exports = UsedBundleSchema

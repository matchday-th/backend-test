'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssetBundleSchema extends Schema {
  up () {
    this.create('asset_bundles', (table) => {
      table.increments()
      table.integer('asset_id').notNullable()
      table.integer('bundle_id').notNullable()
      table.integer('payment_id')
      table.string('redeem_code').notNullable()
      table.datetime('expire_start')
      table.datetime('expire_end')
      table.timestamps()
    })
  }

  down () {
    this.drop('asset_bundles')
  }
}

module.exports = AssetBundleSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssetBundlePromotionSchema extends Schema {
  up () {
    this.create('asset_bundle_promotions', (table) => {
      table.increments()
      table.integer('asset_bundle_id')
      table.integer('promotion_id')
    })
  }

  down () {
    this.drop('asset_bundle_promotions')
  }
}

module.exports = AssetBundlePromotionSchema

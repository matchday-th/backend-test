'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssetBundleBankTransactionSchema extends Schema {
  up () {
    this.create('asset_bundle_bank_transactions', (table) => {
      table.increments()
      table.integer('asset_bundle_id')
      table.integer('bank_transaction_id')
      table.timestamps()
    })
  }

  down () {
    this.drop('asset_bundle_bank_transactions')
  }
}

module.exports = AssetBundleBankTransactionSchema

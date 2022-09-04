'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BankTransaction extends Model {
    asset_bundles() {
        return this.belongsToMany('App/Models/AssetBundle').pivotTable('asset_bundle_bank_transactions')
    }
}

module.exports = BankTransaction

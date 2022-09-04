'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class AssetBundleBankTransaction extends Model {
    asset_bundle() {
        return this.belongsTo('App/Models/AssetBundle')
    }

    bank_transaction() {
        return this.belongsTo('App/Models/BankTransaction')
    }
}

module.exports = AssetBundleBankTransaction

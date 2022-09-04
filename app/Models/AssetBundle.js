'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class AssetBundle extends Model {
    asset() {
        return this.belongsTo('App/Models/Asset')
    }

    bundle() {
        return this.belongsTo('App/Models/Bundle')
    }

    payment() {
        return this.belongsTo('App/Models/Payment')
    }

    bank_transactions() {
        return this
            .belongsToMany('App/Models/BankTransaction')
            .pivotTable('asset_bundle_bank_transactions')
    }

    used_bundles() {
        return this.hasMany('App/Models/UsedBundle')
    }
}

module.exports = AssetBundle

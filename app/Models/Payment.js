'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Payment extends Model {
    user() {
        return this.belongsTo('App/Models/User')
    }

    match() {
        return this.belongsTo('App/Models/Match')
    }

    matches() {
        return this
            .belongsToMany('App/Models/Match')
            .pivotTable('match_payments')   
    }

    asset_bundle() {
        return this.hasMany('App/Models/AssetBundle')
    }
}

module.exports = Payment

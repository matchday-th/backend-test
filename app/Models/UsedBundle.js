'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UsedBundle extends Model {
    asset_bundle() {
        return this.belongsTo('App/Models/AssetBundle')
    }

    match() {
        return this.belongsTo('App/Models/Match')
    }
}

module.exports = UsedBundle

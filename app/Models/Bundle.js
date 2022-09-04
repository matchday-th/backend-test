'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Bundle extends Model {
    static get hidden () {
        return ['deleted']
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    provider_sport() {
        return this.belongsTo('App/Models/ProviderSport')
    }

    asset() {
        return this.belongsTo('App/Models/Asset')
    }

    asset_bundles() {
        return this.hasMany('App/Models/AssetBundle')
    }

    used_bundles() {
        return this.hasMany('App/Models/UsedBundle')
    }

    payment() {
        return this.belongsTo('App/Models/Payment')
    }
}

module.exports = Bundle

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Asset extends Model {
    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    
    user() {
        return this.belongsTo('App/Models/User')
    }

    asset_bundles() {
        return this.hasMany('App/Models/AssetBundle')
    }

    bundles(){
        return this
            .belongsToMany('App/Models/Bundle')
            .pivotTable('asset_bundles')
    }
    
}

module.exports = Asset

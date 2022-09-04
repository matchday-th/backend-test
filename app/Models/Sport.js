'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Sport extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    roles() {
        return this.hasMany('App/Models/Role')
    }

    providers() {
        return this
            .belongsToMany('App/Models/Provider')
            .pivotTable('provider_sports')
            
    }

    provider_sports() {
        return this.hasMany('App/Models/ProviderSport')
    }

}

module.exports = Sport

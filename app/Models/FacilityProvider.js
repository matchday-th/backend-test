'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FacilityProvider extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    
    facility() {
        return this.belongsTo('App/Models/Facility')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }
}

module.exports = FacilityProvider

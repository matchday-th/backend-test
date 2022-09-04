'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Facility extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    static get hidden () {
        return ['created_at','updated_at']
    }

    facility_providers() {
        return this.hasMany('App/Models/FacilityProvider')
    }
}

module.exports = Facility

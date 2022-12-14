'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Role extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    preference_roles() {
        return this.hasMany('App/Models/FacilityProvider')
    }
}

module.exports = Role

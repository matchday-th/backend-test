'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Preference extends Model {
    
    user(){
        return this.belongsTo('App/Models/User')
    }

    matches(){
        return this.hasMany('App/Models/Match')
    }

    roles(){
        return this
            .belongsToMany('App/Models/Role')
            .pivotTable('preference_roles')
    }
}

module.exports = Preference

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Stack extends Model {
    user() {
        return this.belongsTo('App/Models/User')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    matches() {
        return this.hasMany('App/Models/Match')
    }

    contacts() {
        return this.hasMany('App/Models/ContactMatch')
    }
}

module.exports = Stack

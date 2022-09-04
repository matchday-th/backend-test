'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Member extends Model {
    user() {
        return this.belongsTo('App/Models/User')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }
}

module.exports = Member

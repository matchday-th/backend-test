'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Chat extends Model {
    read_messages() {
        return this.hasMany('App/Models/ReadMessage')
    }

    user() {
        return this.belongsTo('App/Models/User')
    }
}

module.exports = Chat

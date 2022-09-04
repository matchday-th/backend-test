'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Blog extends Model {
    provider() {
        return this.belongsTo('App/Models/Provider')
    }
}

module.exports = Blog

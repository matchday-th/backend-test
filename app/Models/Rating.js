'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Rating extends Model {
    static get dates () {
        return ['created_at','updated_at']
    }
    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    user() {
        return this.belongsTo('App/Models/User')
    }

    match() {
        return this.belongsTo('App/Models/Match')
    }
}

module.exports = Rating

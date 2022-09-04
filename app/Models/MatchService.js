'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class MatchService extends Model {
    match() {
        return this.belongsTo('App/Models/Match')
    }

    service() {
        return this.belongsTo('App/Models/Service')
    }
}

module.exports = MatchService

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class MatchDiscount extends Model {
    match_discount() {
        return this.belongsTo('App/Models/Match')
    }
}

module.exports = MatchDiscount
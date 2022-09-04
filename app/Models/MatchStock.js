'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class MatchStock extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    
    stock() {
        return this.belongsTo('App/Models/Stock')
    }
    match() {
        return this.belongsTo('App/Models/Match')
    }
}

module.exports = MatchStock

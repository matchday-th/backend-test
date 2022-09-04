'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class MatchPayment extends Model {

    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    
    match() {
        return this.belongsTo('App/Models/Match')
    }

    payment() {
        return this.belongsTo('App/Models/Payment')
    }
}

module.exports = MatchPayment

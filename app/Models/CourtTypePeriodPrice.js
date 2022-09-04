'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CourtTypePeriodPrice extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    court_type() {
        return this.belongsTo('App/Models/CourtType')
    }

    period_price() {
        return this.belongsTo('App/Models/PeriodPrice')
    }
}

module.exports = CourtTypePeriodPrice

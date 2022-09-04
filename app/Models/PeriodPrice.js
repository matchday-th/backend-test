'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PeriodPrice extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    
    court_types(){
        return this
            .belongsToMany('App/Models/CourtType')
            .pivotTable('court_type_period_prices')
    }
}

module.exports = PeriodPrice

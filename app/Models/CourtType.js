'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CourtType extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    courts() {
        return this.hasMany('App/Models/Court')
    }
    share_courts() {
        return this.hasMany('App/Models/Court','id','sub_court_type_id')
    }

    provider_sport() {
        return this.belongsTo('App/Models/ProviderSport')
    }

    matches() {
        return this.manyThrough('App/Models/Court','matches')
    }

    period_price(){
        return this
            .belongsToMany('App/Models/PeriodPrice')
            .pivotTable('court_type_period_prices')
    }

    time_slots() {
        return this.hasMany('App/Models/TimeSlot')
    }

    fixed_times() {
        return this.hasMany('App/Models/CourtTypeFixedTime')
    }

}

module.exports = CourtType

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ProviderSport extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    courts() {
        return this.manyThrough('App/Models/CourtType','courts')
    }

    court_types() {
        return this.hasMany('App/Models/CourtType')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    sport() {
        return this.belongsTo('App/Models/Sport')
    }

    services() {
        return this.hasMany('App/Models/Service')
    }

    bus_times() {
        return this.hasMany('App/Models/BusTime')
    }

    period_price() {
        return this.hasMany('App/Models/PeriodPrice')
    }

    bundles() {
        return this.hasMany('App/Models/Bundle')
    }
}

module.exports = ProviderSport

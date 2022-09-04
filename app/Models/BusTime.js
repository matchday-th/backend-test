'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BusTime extends Model {
    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    provider_sport() {
        return this.belongsTo('App/Models/ProviderSport')
    }
}

module.exports = BusTime

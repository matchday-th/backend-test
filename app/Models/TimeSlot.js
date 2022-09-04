'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TimeSlot extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    court_type() {
        return this.belongsTo('App/Models/CourtType')
    }

    slot_prices() {
        return this.hasMany('App/Models/SlotPrice')
    }
}

module.exports = TimeSlot

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SlotPrice extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    time_slot() {
        return this.belongsTo('App/Models/TimeSlot')
    }
}

module.exports = SlotPrice

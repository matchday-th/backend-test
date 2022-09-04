'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ConditionPromotion extends Model {
    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    promotion() {
        return this.belongsTo('App/Models/Service')
    }
}

module.exports = ConditionPromotion

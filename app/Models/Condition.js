'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Condition extends Model {
    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    promotions() {
        return this
            .belongsToMany('App/Models/Promotion')
            .pivotTable('condition_promotions')   
    }
}

module.exports = Condition

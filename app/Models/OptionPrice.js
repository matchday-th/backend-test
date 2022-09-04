'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class OptionPrice extends Model {
    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }
}

module.exports = OptionPrice

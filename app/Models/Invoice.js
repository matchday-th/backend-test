'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Invoice extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    payments() {
        return this.hasMany('App/Models/Payment')
    }
}

module.exports = Invoice

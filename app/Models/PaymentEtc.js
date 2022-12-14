'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PaymentEtc extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
}

module.exports = PaymentEtc

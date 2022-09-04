'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Receipt extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    discount_type(){
        return this.belongsTo('App/Models/Discount')
    }
    pos_payment(){
        return this.hasOne('App/Models/PosPayment')
    }
    provider(){
        return this.belongsTo('App/Models/Provider')
    }
}

module.exports = Receipt

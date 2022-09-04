'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PosPayment extends Model {

    receipt() {
        return this.belongsTo('App/Models/Receipt')
    }

    used_inventory() {
        return this.belongsTo('App/Models/UsedInventory')
    }
}

module.exports = PosPayment

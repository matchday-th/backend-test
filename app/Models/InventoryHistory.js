'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class InventoryHistory extends Model {
    inventory() {
        return this.belongsTo('App/Models/Inventory')
    }
    staff() {
        return this.belongsTo('App/Models/Staff')
    }

    inventory_price_history(){
        return this.hasOne('App/Models/InventoryPriceHistory')
    }
}

module.exports = InventoryHistory

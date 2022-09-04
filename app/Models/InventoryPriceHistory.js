'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class InventoryPriceHistory extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    inventory_history(){
        return this.belongsTo('App/Models/InventoryHistory')
    }
    
}

module.exports = InventoryPriceHistory

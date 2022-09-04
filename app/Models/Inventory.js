'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Inventory extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
      }

    inventory_histories() {
        return this.hasMany('App/Models/InventoryHistory')
    }
    used_inventory() {
      return this.hasMany('App/Models/UsedInventory')
    }
    item_type() {
    return this.belongsTo('App/Models/ItemType')
    }
    provider(){
      return this.belongsTo('App/Models/Provider')
  }
}

module.exports = Inventory

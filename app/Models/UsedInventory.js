'use strict'

const Model = use('Model')
const Inventory = use('App/Models/Inventory')
const { Checker, Update } = require('./HookHelper/InventoryHook')

class UsedInventory extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')

        this.addHook('afterCreate', async (used) => {
            try {
                used = used.toJSON()
                const { amount } = used
                const res = await Update.inventory_remaining(used, amount, 'afterCreate')
                console.log(res);
            } catch (err) {
                console.log(err);
            }
        })

        this.addHook('beforeUpdate', async (used) => {
            try {
                if (used.$attributes.amount != used.$originalAttributes.amount) {
                    const amount = used.$attributes.amount - used.$originalAttributes.amount
                    used = used.toJSON()
                    const res = await Update.inventory_remaining(used, amount, 'beforeUpdate')
                    console.log(res);
                } else {
                    console.log('no changes');
                }

            } catch (err) {
                console.log(err);
            }
        })

        this.addHook('afterDelete', async (used) => {
            try {
                used = used.toJSON()
                const { amount } = used
                const res = await Update.inventory_remaining(used, -amount, 'afterDelete')
                console.log(res);
            } catch (err) {
                console.log(err);
            }
        })

    }
    inventory() {
        return this.belongsTo('App/Models/Inventory')
    }
    user() {
        return this.belongsTo('App/Models/User')
    }
    match() {
        return this.belongsTo('App/Models/Match')
    }
    staff(){
        return this.belongsTo('App/Models/Staff')
    }
}

module.exports = UsedInventory


const Utility = require('../../Controllers/Http/Utility.js')
const Inventory = use('App/Models/Inventory')

const InventoryHook = {
    Update: {
        async inventory_remaining( used_inventory, amount, type ) {
            try {
                const { inventory_id } = used_inventory
                const inventory = await  Inventory.find(inventory_id)
                const value = inventory.remaining_amount - amount

                await inventory.merge({ remaining_amount: value })
                await inventory.save()

                return { type, value }
            } catch (err) {
                // console.log(err);
            }
        },
        async provider_last_inventory(provider_id) {
            try {
                const inventory = await Inventory
                    .query()
                    .where('provider_id', provider_id)
                    .where('remove', 0)
                    .with('inventory_histories')
                    .with('used_inventory',(u)=>{
                        u.with('match')
                    })
                    .fetch()
                    
                // p.inventories = Utility.Mutator.getInventoriesRemaining(p.inventories)
            } catch (err) {

            }
        }
    }
}

module.exports = InventoryHook
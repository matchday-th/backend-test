
const Utility = require('./Utility.js');

const Bridge = {
    Selector: {
        action_selector(match_id, body) {
            //TODO Catch Service/Inventory Methods to Update or Create
        }
    },
    Package: {
        async update_MatchService({match_id, body}) {
            const { update, create, remove } = body
            if (update) {
                const res = await Utility.Manage.Service.update(update, match_id)
            }
            if (create) {
                const res = await Utility.Manage.Service.create({match_id: match_id, create: create})
            }
            if (remove) {
                const res = await Utility.Manage.Service.remove(remove)
            }
        },
        async update_MatchInventory({match_id, body}) {
            const { update, create, remove } = body
            if (update) {
                const res = await Utility.Manage.Inventory.update(update, match_id)
            }
            if (create) {
                const res = await Utility.Manage.Inventory.create({match_id: match_id, create: create})
            }
            if (remove) {
                const res = await Utility.Manage.Inventory.remove(remove)
            }
        }
    },
    Payment(productdetail) {
        console.log(productdetail);
        return productdetail
    }
}

module.exports = Bridge
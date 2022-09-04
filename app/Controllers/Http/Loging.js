const InventoryHistory = use('App/Models/InventoryHistory')
const InventoryPriceHistory = use('App/Models/InventoryPriceHistory')

const Loging = {
    Inventory: {
        async addHisTory(status,inventory_id,staff_id, {price, refill }){
            let inventoryHistory = new InventoryHistory()
            inventoryHistory.inventory_id = inventory_id
            if(staff_id){
                inventoryHistory.staff_id = staff_id
            }
            if (refill) inventoryHistory.refill = refill
            inventoryHistory.status = status
            await inventoryHistory.save()

            if(inventoryHistory.status == 0){
                const inventoryPriceHistory = new InventoryPriceHistory()
                inventoryPriceHistory.inventory_history_id = inventoryHistory.id
                inventoryPriceHistory.price = price
                await inventoryPriceHistory.save()
            }
            
            return inventoryHistory.toJSON()
            }
    },
    STATUSCODE: {
        0: 'สร้างสินค้า',
        1: 'แก้ไขชื่อ/ราคา',
        2: 'ลบสินค้า',
        3: 'เติมสินค้า +',
        4: 'ปรับปรุงสินค้า +',
        5: 'ปรับปรุงสินค้า -',
        6: 'ยกเลิกการขาย +',
        7: 'ขายสินค้า -',
        8: 'เบิกจ่ายสินค้า -'
    },
    STATUSKEY: {
        created: 0,
        edited: 1,
        removed: 2,
        refilled: 3,
        increase_refilled: 4,
        decrease_refilled: 5,
        canceled: 6,
        selled: 7,
        disburse: 8
    }
}
module.exports = Loging
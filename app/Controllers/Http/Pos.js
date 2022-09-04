const Receipt = use('App/Models/Receipt')
const UsedInventory = use('App/Models/UsedInventory')
const ItemType = use('App/Models/ItemType')
const InventoryHistory = use('App/Models/InventoryHistory')
const PosPayment = use('App/Models/PosPayment')
const Inventory = use('App/Models/Inventory')
const InventoryPriceHistory = use('App/Models/InventoryPriceHistory')
const PaymentEtc = use('App/Models/PaymentEtc')
const Discount = use('App/Models/Discount')

const Utility = require("./Utility")
const Loging = require("./Loging")
const moment = use('moment')
const { timeFormat ,monthFormat, dateFormat} = require("./Helper")
const Pos = {
    Creater: {
        async createReceipt({username, inventories, created_at, discount, provider, staff_id}){
            try {
                var discount_price = discount? discount.discount_price:0
                var created_at = created_at? created_at : moment().format(timeFormat)
                const create_used =  await Utility.Creator.useInventory({inventories ,created_at, staff_id})
                const ids = create_used.map(e=>e.id)

                const receipt = new Receipt()
                receipt.provider_id = provider.id
                receipt.used_inventory_ids = ids.toString()
                receipt.username = username
                receipt.total_price = inventories.reduce((a,b)=>a+(b.price*b.amount),0) - discount_price
                receipt.discount = discount_price
                receipt.discount_id = discount? discount.id : null
                receipt.created_at = created_at
                receipt.updated_at = created_at
                await receipt.save()

                Pos.Updater.updateReceiptProvider()
                return {status:"success",receipt, create_used}
            } catch (error) {
                console.log(error)
                return {status:"fail", error:error}
            }
        },
        async createItemType({provider_id,type_name}){
            try {
                const result = new ItemType()
                result.provider_id = provider_id
                result.type_name = type_name
                await result.save()

                return {status:"success",result}
            } catch (error) {
                return {status:"fail", error:error}
            }
        },
        async createPosPayment({used_inventories,receipt, payment_status, paid_amount}){
            payment_status = payment_status? payment_status : 'offline'
                try {
                    if(used_inventories){
                        const input = used_inventories.map(i => i = {used_inventory_id: i.id, paid_amount: i.price*i.amount, payment_status})
                        await PosPayment.createMany(input)
                    }

                    if(receipt){
                        const input = {receipt_id: receipt.id, paid_amount, payment_status}
                        await PosPayment.create(input)
                    }
                } catch (error) {
                    console.log(error)
                }
        },
        async createPaymentEtc({provider_id, payment}){
            try {
                const etc = new PaymentEtc()
                etc.provider_id = provider_id
                etc.name = payment.name
                etc.amount = payment.amount
                etc.price = payment.price
                etc.created_at = payment.created_at
                etc.updated_at = payment.created_at
                await etc.save()
                
                return {status:"success", etc}
            } catch (error) {
                console.log(error)
                return {status:"fail", error:error}
            }
        }
    },
    Updater: {
        async payReceipt({ids, paid_amount, payment_status}){
            try {
                var receipts = await Receipt
                                .query()
                                .whereIn('id',ids)
                                .fetch()
                receipts = receipts.toJSON()
                receipts = receipts.filter(r=>r.total_paid<r.total_price)
               
                var paid_summary = paid_amount
                var result = []
                for( r in receipts){
                    var paid = paid_summary
                    var summary_price = receipts[r].total_price - receipts[r].total_paid
                    paid = paid >= summary_price ?summary_price : paid_summary
                    if(paid_summary>0){
                        const receipt = await Receipt.find(receipts[r].id)
                        await receipt.merge( { total_paid: paid + receipts[r].total_paid})
                        await receipt.save()
                        await Pos.Creater.createPosPayment({receipt, payment_status, paid_amount: paid})
                        result.push(receipt)
                        paid_summary = paid_summary - paid
                    }
                }

                return {status:"success",result}
            } catch (error) {
                console.log(error)
                return {status:"fail", error:error}
            }
        },
        async editItemType({id, type_name}){
            try {
                const result = await ItemType.find(id)
                await result.merge( { type_name: type_name})
                await result.save()

                return {status:"success",result}
            } catch (error) {
                return {status:"fail", error:error}
            }
        },
        async updateReceiptProvider(){
                var receipt_providers = await Receipt
                                        .query()
                                        .whereDoesntHave('provider')
                                        .fetch()
                receipt_providers = receipt_providers.toJSON()

                for(var i in receipt_providers){
                    var receipt_provider = receipt_providers[i]
                    var used_inventory_id = JSON.parse("[" + receipt_provider.used_inventory_ids+ "]")[0];

                    var used = await UsedInventory
                                .query()
                                .where('id',used_inventory_id)
                                .with('inventory')
                                .fetch()
            
                    receipt_providers[i].provider_id =  used.toJSON()[0].inventory.provider_id
                    const receipt_save = await Receipt.find(receipt_providers[i].id)
                    await receipt_save.merge(receipt_providers[i])
                    await receipt_save.save()
                }
        }
    },
    Remover:{
        async removeUsedInventory(id){
            try {
                const result = await UsedInventory.find(id)
               

                const receipt = await Receipt
                                .query()
                                .where('used_inventory_ids','like','%'+id+'%')
                                .first()
                if(receipt){
                    var ids = receipt.toJSON().used_inventory_ids
                    ids = JSON.parse("[" + ids + "]");
                    if(ids.length >=2 ){
                        var filteredAry = ids.filter(e => e != id)
                        var total_price = receipt.total_price -(result.amount*result.price)
                        await receipt.merge({used_inventory_ids : filteredAry.toString(),total_price: total_price})
                        await receipt.save()
                    }else{
                        await receipt.delete()
                    }
                }
                    await result.delete()
                    return {status:"success"}
                } catch (error) {
                    return {status:"fail", error:error}
                }
        },
        async removeItemType(id, provider){
            try {
                const type = await ItemType.find(id)
                //validate
                if(type && type.provider_id == provider.id){
                    const check_used = await Inventory
                                        .query()
                                        .where('item_type_id', type.id)
                                        .where('remove', 0)
                                        .fetch()

                    if(check_used.toJSON().length>0){
                        return {status:"fail", error: 'type active'}
                    }else{
                        await check_used.delete()
                        return {status:"success", check_used}
                    }
                }else{
                    return {status:"fail", error: 'auth fail'}
                }
            } catch (error) {
                console.log(error)
                return {status:"fail", error: error}
            }
        },
        async removeRefillItem(history_id){
            try {
                const result = await InventoryHistory.find(history_id)
                await result.delete()

                return {status:"success",result}
            } catch (error) {
                return {status:"fail", error:error}
            }
        },
        async removePaymentEtc(id){
           try {
                const result = await PaymentEtc.find(id)
                await result.delete() 
                return {status:"success",result}
            } catch (error) {
                return {status:"fail", error:error}
            }
        }
    },
    Query: {
        async getPriceHistory(provider){
          try {
                  var history = await InventoryHistory
                            .query()
                            .with('inventory',(i)=>{
                                i.where('provider_id', provider.id)
                            })
                            .with('inventory_price_history')
                            .whereHas('inventory_price_history')
                            .fetch()

            history = history.toJSON()
            history = history.sort(function(a, b) {          
                if (a.inventory_id === b.inventory_id) {
                   return a.id - b.id;
                }
                return a.inventory_id > b.inventory_id ? 1 : -1;
             })

            var change_price_histories = []
            var group_by_inventory = history.reduce(function (r, a) {
                r[a.inventory_id] = r[a.inventory_id] || [];
                r[a.inventory_id].push(a);
                return r;
            }, Object.create(null));

            for(var i in group_by_inventory){
                for(var j in group_by_inventory[i]){
                    var history = group_by_inventory[i][j]
                    if(j < group_by_inventory[i].length -1){
                        if(history.status == 0){
                            change_price_histories.push({
                                name: history.inventory.name, 
                                before: history.inventory_price_history.price, 
                                after: group_by_inventory[i][parseInt(j)+1].inventory_price_history.price,
                                created_at: group_by_inventory[i][parseInt(j)+1].created_at})
                           }
                          else if(history.status == 1){
                            change_price_histories.push({
                                name: history.inventory.name, 
                                before: history.inventory_price_history.price, 
                                after: group_by_inventory[i][parseInt(j)+(j < group_by_inventory[i].length-1?1:0)].inventory_price_history.price,
                                created_at: group_by_inventory[i][parseInt(j)+(j < group_by_inventory[i].length-1?1:0)].created_at})
                           }
                    }
                }
            }
          } catch (error) {
              
          }
           
            change_price_histories = change_price_histories.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at))
            return change_price_histories

        },
        async getReceiptDate(date){
            var receipt = await Receipt
                        .query()
                        .where('created_at','like','%'+date+'%')
                        .whereNot('username',null)
                        .with('pos_payment')
                        .fetch()

            return receipt.toJSON()
        },
        async getDisCountOfMonth(month, provider_id){
            var receipt = await Receipt
                        .query()
                        .where('created_at','like','%'+month+'%')
                        .where('discount','>',0)
                        .with('discount_type')
                        .fetch()

            receipt = receipt.toJSON()
            for( i in receipt){
                var used_inventory_ids = JSON.parse("[" + receipt[i].used_inventory_ids + "]");
                const used_inventory = await UsedInventory
                                        .query()
                                        .whereIn('id', used_inventory_ids)
                                        .with('inventory')
                                        .whereHas('inventory',i=>{
                                            i.where('provider_id', provider_id)
                                        })
                                        .fetch()
                    receipt[i].used_inventory = used_inventory.toJSON()
            }
            receipt = receipt.filter(r=> r.used_inventory.length>0)
            return receipt
        },
        async getUsedInventory(ids,provider_id){
            var result = await UsedInventory
                        .query()
                        .whereIn('id',ids)
                        .with('inventory')
                        .whereHas('inventory',(i)=> {
                            i.where('provider_id',provider_id)
                         })
                        .fetch()
            result = result.toJSON()
            result.map(s=>{
                s.name = s.inventory.name
                return s
            })            
            return result           
        },
        async getByInventory(date,provider_id){
            var result = await UsedInventory
                        .query()
                        .where('created_at','like','%'+date+'%')
                        .where('match_id', null)
                        .with('inventory.provider')
                        .whereHas('inventory',(i)=> {
                            i.where('provider_id',provider_id)
                         })
                        .with('staff')
                        .fetch()

            result = result.toJSON()
            result.map(s=>{
                s.name = s.inventory.name
                // s.created_at = moment(s.created_at).format(timeFormat)
                s.by = s.staff ? s.staff.fullname : s.inventory.provider.fullname
                delete s.inventory.provider
                return s
            }) 

            const used_ids = result.map(i=>i = i.id)
            var receipts = await Receipt
                            .query()
                            .whereIn('used_inventory_ids',used_ids)
                            .select(['id','used_inventory_ids'])
                            .with('pos_payment')
                            .fetch()

            receipts = receipts.toJSON().map(r=>{
                r.used_inventory_ids = JSON.parse("[" + r.used_inventory_ids + "]");
                return r
            })

            var used_pos_payment = []
            receipts.forEach(r=>{
                r.used_inventory_ids.forEach(used=>{
                    used_pos_payment.push({id: used, pos_payment: r.pos_payment})
                })
 
            })


            result.forEach(r=>{
                used_pos_payment.forEach(used=>{
                    if(r.id  == used.id){
                        r.pos_payment = used.pos_payment
                    }
                })
            })
            return result.sort((a,b) => b.created_at - a.created_at)
        },
        async getItemType(provider){
                const result = await ItemType
                            .query()
                            .where('provider_id',provider.id)
                            .orWhere('provider_id',null)
                            .fetch()

                return result.toJSON() 
        },
        async getRefillHistory(provider, month){
            var refill = await Inventory
                        .query()
                        .where('provider_id',provider.id)
                        .with('inventory_histories')
                        .whereHas('inventory_histories',(history)=>{
                            history.where('updated_at','LIKE',`%${month}%`)
                            history.where('status', 3)
                            history.with('staff')
                        })
                        .fetch()

            var summary_refill = refill.toJSON().map(i =>{ 
                    var staffs = []
                    i.inventory_histories = i.inventory_histories.filter(f=>f.status == 3)
                    i.status = `เติมสินค้า (+${i.inventory_histories.reduce((a,b)=>a+b.refill,0)})`
                    i.inventory_histories.forEach(i=>{
                        staffs.push(i.staff = i.staff? i.staff.fullname:provider.fullname)
                    })
                    staffs = ([...new Set(staffs)]);
                    i.staff = staffs.toString()

                    delete i.inventory_histories
            return i
            })
            return summary_refill
        },
        async getChangeSummary(provider, month){
            var refill = await Inventory
                        .query()
                        .where('provider_id',provider.id)
                        .with('inventory_histories')
                        .whereHas('inventory_histories',(history)=>{
                            history.where('updated_at','LIKE',`${month}%`)
                            history.whereIn('status', [4,5])
                            history.with('staff')
                        })
                        .fetch()
            var summary_refill = refill.toJSON().map(i =>{
                    var staffs = []
                    var increase = i.inventory_histories.filter(f=>f.status==4).reduce((a,b)=>a+b.refill,0)
                    var decrease = i.inventory_histories.filter(f=>f.status==5).reduce((a,b)=>a+b.refill,0)
                    i.status = `ปรับปรุงสินค้า ${increase > 0?'(+'+increase+')':''}${decrease > 0?'(-'+decrease+')':''}`
                    i.inventory_histories.forEach(i=>{
                        staffs.push(i.staff = i.staff? i.staff.fullname:provider.fullname)
                    })
                    staffs = ([...new Set(staffs)]);
                    i.staff = staffs.toString()

                    delete i.inventory_histories
            return i
            })
            return summary_refill
        },
        async getDisburseSummary(provider, month){
            var refill = await Inventory
                        .query()
                        .where('provider_id',provider.id)
                        .with('inventory_histories')
                        .whereHas('inventory_histories',(history)=>{
                            history.where('updated_at','LIKE',`${month}%`)
                            history.whereIn('status', [Loging.STATUSKEY.disburse])
                            history.with('staff')
                        })
                        .fetch()
            var summary_refill = refill.toJSON().map(i =>{
                    var staffs = []
                    var disburse = i.inventory_histories.filter(f=>f.status == Loging.STATUSKEY.disburse).reduce((a,b)=>a+b.refill,0)
                    i.status = `เบิกจ่ายสินค้า (-${disburse})`
                    i.inventory_histories.forEach(i=>{
                        staffs.push(i.staff = i.staff? i.staff.fullname:provider.fullname)
                    })
                    staffs = ([...new Set(staffs)]);
                    i.staff = staffs.toString()

                    delete i.inventory_histories
            return i
            })
            return summary_refill
        },
        async getPaymentEtc(provider_id, date){
            const etc = await PaymentEtc
                            .query()
                            .where('provider_id', provider_id)
                            .where('created_at','like','%'+date+'%')
                            .fetch()
            const result = etc.toJSON()
            return result.reverse()
        },
        async getDiscountType(){
            const discount = await Discount
                            .query()
                            .fetch()
            var result = discount.toJSON().map(e=>{
                e.percents = JSON.parse("[" + e.percents + "]");
                return e
            })
            return result
        }
    },
    Calculate: {
        getReceipHistory(receipt_used, used_inventory){
            var result = []
            receipt_used = receipt_used.filter((receipt)=>used_inventory.map(ui=>ui.id).includes(receipt.used_id))
            receipt_used.map(receipt=>{
                used_inventory.map(used=>{
                    used.priced = used.amount*used.price

                    if(receipt.used_id == used.id){
                        receipt.used = used
                    }
                    return used
                })
                return receipt
            })
            const user_groups = receipt_used.reduce((groups, item) => {
                var group = []
                group = (groups[item.username] || []);
                group.push(item);
                
                groups[item.username] = group;
                return groups;
              }, {});


              const objectArray = Object.entries(user_groups);
              objectArray.forEach(([key, value]) => {
                  var receipt_has_pospayment = value.filter((r)=> r.pos_payment)
                result.push({
                    id: value[0].id,
                    ids: Pos.Calculate.removeIdDuplicate(value.map(v=>v.id)),
                    username:key, 
                    used: value.map(used=>{
                    return used.used
                    }), 
                    total_paid: value.reduce((a,b)=>a+b.total_paid,0),
                    discount: value.reduce((a,b)=>a+b.discount_price,0),
                    pos_payment: receipt_has_pospayment.length>0 ? value[receipt_has_pospayment.length-1].pos_payment : null
                })
              });
              result.map(i=>{
                  var total_price = i.used.reduce((a,b)=>a+b.priced,0)
                  i.total_price = total_price - i.discount
                  i.summary_price = i.total_price - i.total_paid
                  return i
              })
              return result
        },
        removeIdDuplicate(ids){
            var id
            var result = []
            ids.forEach(i=>{
                if(id != i){
                    result.push(i)
                    id = i
                }
            })
            return result
        }
    },
    Show: {
        async receiptHistory(date,provider_id){
            var receipt_used = []
            const receipt = await Pos.Query.getReceiptDate(date)
            receipt.forEach(r=>{
              var ids = JSON.parse("[" + r.used_inventory_ids + "]");
              var check_id
              ids.forEach(id=>{
                  if(r.id!= check_id){
                    receipt_used.push({id: r.id, username: r.username, total_paid: r.total_paid, used_id: id, discount_price: r.discount, pos_payment: r.pos_payment})
                  }else{
                    receipt_used.push({id: r.id, username: r.username, total_paid: 0, used_id: id, discount_price: 0, pos_payment: r.pos_payment})
                  }
                  check_id = r.id
              })
            })

            const used_id = receipt_used.map(used_id=>used_id.used_id)
            const used_inventory = await Pos.Query.getUsedInventory(used_id,provider_id)
            const result = Pos.Calculate.getReceipHistory(receipt_used,used_inventory)
            return result
        },
        async getDiscountHistory(date, provider_id){
            var discount_history = await Pos.Query.getDisCountOfMonth(date, provider_id)
            discount_history =  discount_history.map(r=> r ={
                created_at: moment(r.created_at).format(timeFormat),
                type: r.discount_type? r.discount_type.name: null,
                discount_prices: r.discount,
                items: r.used_inventory.map(u=> u ={
                    item: `(${u.amount}) ${u.inventory.name}`
                }),
            })
            discount_history = discount_history.reverse()

            const total_discount_prices = discount_history.reduce((a,b)=> a+b.discount_prices,0)
            const result = {discount_history, total_discount_prices}
            return result
        }
    }
}
module.exports = Pos; 
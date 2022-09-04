'use strict'
const Inventory = use('App/Models/Inventory')
const InventoryHistory = use('App/Models/InventoryHistory')
const Loging = require('../Loging.js')
const FilterHelper = require('../FilterHelper.js')
const Pos = require('../Pos.js')
const ItemType = use('App/Models/ItemType')
const moment = use('moment')
const Receipt = use('App/Models/Receipt')

const { timeFormat ,monthFormat, dateFormat} = require("../Helper")
const { request } = require('express')
const InventoryPriceHistory = use('App/Models/InventoryPriceHistory')
const PaymentEtc = use('App/Models/PaymentEtc')

const User = use('App/Models/User')

class InventoryController {
    async createInventory({response,request,auth}){
        const{
            name,
            price,
            item_type_id,
            barcode,
            staff_id
        } = request.body
        try{
            const provider = await auth.getUser()
            let inventory = new Inventory()
            inventory.name = name
            inventory.item_type_id = item_type_id
            inventory.price = price
            inventory.barcode = barcode
            inventory.provider_id = provider.id
            await inventory.save()
            
            
            let historyResult = await Loging.Inventory.addHisTory(Loging.STATUSKEY.created, inventory.id,staff_id, {price})

            return response.send({status: 'success', created:inventory.toJSON(),inventoryHistory: historyResult})
        }catch(err){
            console.log(err);
            return response.send({status: 'fail', error: err.toString()})
        }
    }
    async updateInventory({response,request,auth,params}){
        var {data,staff_id} = request.body
     
        try{
            let result;
            let inventoryHistory = new InventoryHistory()
       
            inventoryHistory.inventory_id = params.inventory_id
            if(staff_id){
                inventoryHistory.staff_id = staff_id
            }
            if(data.refill){
                inventoryHistory.refill = data.refill
                inventoryHistory.status = Loging.STATUSKEY.refilled
            }else if(data.increase_refill){
                inventoryHistory.refill = data.increase_refill
                inventoryHistory.status = Loging.STATUSKEY.increase_refilled
            }else if(data.decrease_refill){
                inventoryHistory.refill = data.decrease_refill
                inventoryHistory.status = data.status == 8 ?  Loging.STATUSKEY.disburse : Loging.STATUSKEY.decrease_refilled
            }
            else{          
                let  inventory = await Inventory.find(params.inventory_id)
                if(inventory.id){
                        inventoryHistory.status = Loging.STATUSKEY.edited
                        await inventory.merge(data)
                        await inventory.save()
                        result = inventory.toJSON()
                }
            }

            await inventoryHistory.save()
            if(inventoryHistory.status == Loging.STATUSKEY.edited && data.price != null){
                const inventoryPriceHistory = new InventoryPriceHistory()
                inventoryPriceHistory.inventory_history_id = inventoryHistory.id
                inventoryPriceHistory.price = data.price
                await inventoryPriceHistory.save()
            }
            
            return response.send({status: 'success',updated: result,inventoryHistory: inventoryHistory })
        } catch (err) {
                return response.send({status : 'fail', error:err})
            }
    }

    async getInventory({response,auth,params}){
        try{
                const provider = await auth.getUser()
                const result = await FilterHelper.Filter.inventoryDatetime(provider.id, params.datetime, monthFormat)
            return response.send(result)
        }catch(err){
            return response.send({status : 'fail', error:err})
        }
    }
    //date of month
    async getInventoryDOM({response,request,auth,params}){
        var date = moment(params.datetime).format(monthFormat)
        try{
            const provider = await auth.getUser()
            var all_items = await Inventory
                            .query()
                            .where('provider_id',provider.id)
                            .where('remove',0)
                            .with('used_inventory',(used) => {
                                used.where('created_at','LIKE',`%${date}%`)
                                used.with('match')
                            })
                            .with('item_type')
                            .fetch()
            
            const cost_etc = await PaymentEtc
                            .query()
                            .where('provider_id',provider.id)
                            .where('created_at','LIKE',`%${date}%`)
                            .fetch()

            all_items = all_items.toJSON()
            const result = all_items.map(trx => {
                var total_dates = []
                trx.used_inventory = trx.used_inventory.filter((ui)=> !ui.match  || ui.match.cancel == 0)
                trx.used_inventory.forEach(use => {
                    total_dates.push(moment(use.created_at).format(dateFormat))
                })
                total_dates = [...new Set(total_dates)]
                total_dates = total_dates.map(date => {
                    var amount = trx.used_inventory.filter(use => moment(use.created_at).format(dateFormat) == date).map(use => use.amount)
                    var income = trx.used_inventory.filter(use => moment(use.created_at).format(dateFormat) == date).map(use => use.price*use.amount)
                    amount.push(0)
                    amount.push(0)

                    amount = amount.reduce((a,b)=>parseFloat(a)+parseFloat(b))
                    income = income.reduce((a,b)=>parseFloat(a)+parseFloat(b))
                    var list = trx.used_inventory.filter(use => moment(use.created_at).format(dateFormat) == date)
                    list.forEach(l => {
                        if(l.match){
                            l.match = {
                                id: l.match.id,
                                cancel: l.match.cancel
                            }
                        }
                    })
                    return {
                        id: trx.id,
                        name: trx.name,
                        used: amount,
                        income: income,
                        date: date,
                        list: list,
                        item_type : trx.item_type
                    }
                })
                return total_dates
            })
            var merge_array = []
            result.forEach(res => {
                res.forEach(item => {
                    merge_array.push(item)
                })
            })

            cost_etc.toJSON().forEach(etc=>{
                merge_array.push({
                    id: etc.id,
                    name: etc.name,
                    used: etc.amount,
                    income: -(etc.amount * etc.price),
                    date: moment(etc.created_at).format(dateFormat),
                    list: [],
                    item_type: {}
                })
            })
            merge_array = merge_array.sort((a,b) => moment(b.date,dateFormat).unix() - moment(a.date,dateFormat).unix())
            return response.send(merge_array)
        }catch(err){
            console.log(err)
            return response.send({status : 'fail', error:err})
        }
    }

    async getFilterDate({response,request,auth,params}){
        try{
            const provider = await auth.getUser()
            const result = await FilterHelper.Filter.inventoryDatetime(provider.id, params.datetime, dateFormat)
            return response.send(result)          
        }catch(err){
            console.log(err)
            return response.send({status : 'fail', error:err})
        }
    }

    async getHistory({response, request ,auth}){
        try{
            const month = request.get().date
            const provider = await auth.getUser()
            let inventoryHistory = await InventoryHistory
                                 .query()
                                 .where('updated_at','LIKE',`${month}%`)
                                 .with('inventory')
                                 .whereHas('inventory',(i)=> {
                                    i.where('provider_id',provider.id)
                                 })
                                 .with('staff')
                                 .fetch()
            var result = inventoryHistory.toJSON().sort((a,b)=> moment(b.updated_at,timeFormat).unix()-moment(a.updated_at,timeFormat).unix())
            result.map(r=> {
                r.status_id = r.status
                r.staff = r.staff? r.staff.fullname:provider.fullname
                r.status = `${Loging.STATUSCODE[r.status]}${r.refill? r.refill:''}`
            })

            return response.send(result)    
        }catch(err){
            return response.send({status : 'fail', error:err})
        }
    }

    async removeInventory({response,request,auth,params}){
        const {staff_id} = request.body
        try{
            const provider = await auth.getUser()
            const inventory = await Inventory
                             .query()
                             .where('id',params.inventory_id)
                             .where('provider_id',provider.id)
                             .first()
            if(inventory){
                inventory.remove = true
                await inventory.save()

                let historyResult = await Loging.Inventory.addHisTory(Loging.STATUSKEY.removed, params.inventory_id,staff_id, {price:null})

                return response.send({status: 'success', removed:inventory.toJSON(),inventoryHistory: historyResult}) 
            }else{
                return response.send({status : 'fail', error:'error'})
            }                       
        }catch(err){
            return response.send({status : 'fail', error:err})
        }
    }

    async getAllItemType({response,request,auth,params}){
            const provider = await auth.getUser()
            const result = await Pos.Query.getItemType(provider)
            return response.send(result)
    }
    async createReceipt({response,request,auth}){
        const{username,inventories, created_at, discount, staff_id} = request.body
        const provider = await auth.getUser()
        const result =  await Pos.Creater.createReceipt({username, inventories, created_at, discount, provider, staff_id})
            return response.send(result)
    }
    async receiptHistory({response,params,auth}){
        const provider = await auth.getUser()
        const result = await Pos.Show.receiptHistory(params.date,provider.id)
        return response.send(result)
    }
    async payReceipt({response,request,params,auth}){
        const{receipt_ids, paid_amount, payment_status} = request.body
            const result =  await Pos.Updater.payReceipt({ids: receipt_ids, paid_amount, payment_status})
            return response.send(result)
    }
    async byHistory({response,request,params,auth}){
            const provider = await auth.getUser()
            const result = await Pos.Query.getByInventory(params.date,provider.id)
            return response.send(result)
    }
    async removeUsedInventory({response,params}){
            const result = await Pos.Remover.removeUsedInventory(params.id)
            return response.send(result)
    }
    async createItemType({response,request,auth}){
        const{type_name} = request.body
            const provider = await auth.getUser()
            const result =  await Pos.Creater.createItemType({provider_id: provider.id, type_name: type_name})
            return response.send(result)
    }
    async updateItemType({response,request,params,auth}){
        const{type_name} = request.body
            const result =  await Pos.Updater.editItemType({id: params.id, type_name: type_name})
            return response.send(result)
    }
    async removeItemType({response,request,params,auth}){
            const provider = await auth.getUser()
            const result =  await Pos.Remover.removeItemType(params.id, provider)
            return response.send(result)
    }
    async removeRefill({response,request,params,auth}){
            const result =  await Pos.Remover.removeRefillItem(params.id)
            return response.send(result)
    }
    async getSummaryHistory({response, request ,auth}){
        try{
            const month = request.get().date
            const provider = await auth.getUser()
            const refills =  await Pos.Query.getRefillHistory(provider, month)
            const changes =  await Pos.Query.getChangeSummary(provider, month)
            const disburses =  await Pos.Query.getDisburseSummary(provider, month)
            return response.send({refills, changes, disburses})    
        }catch(err){
            return response.send({status : 'fail', error:err})
        }
    }
    async priceHistory({response, request ,auth}){
        const provider = await auth.getUser()
        const result = await Pos.Query.getPriceHistory(provider)
        return response.send(result)
    }

    async createPaymentEtc({response, request ,auth}){
        const provider = await auth.getUser()
        const result = await Pos.Creater.createPaymentEtc({provider_id: provider.id, payment: request.body })
        return response.send(result)
    }

    async getPaymentEtc({response, request, params, auth}){
        const provider = await auth.getUser()
        const result = await Pos.Query.getPaymentEtc(provider.id, params.date)
        return response.send(result)
    }
    async removePaymentEtc({response, request, params, auth}){
        const result = await Pos.Remover.removePaymentEtc(params.id,)
        return response.send(result)
    }
    async getDiscountType({response, request, params, auth}){
        const result = await Pos.Query.getDiscountType()
        return response.send(result)
    }
    async getDiscountHistory({response, request, params, auth}){
        const provider = await auth.getUser()
        const result = await Pos.Show.getDiscountHistory(params.datetime, provider.id)
        return response.send(result)
    }

    async itemHistory ({ response, request, params, auth }) {
        try {
            const provider = await auth.getUser()
            const inventoryHistory = await InventoryHistory
                                    .query()
                                    .where('inventory_id', params.id)
                                    .with('inventory')
                                    .whereHas('inventory',(i)=> {
                                        i.where('provider_id',provider.id)
                                    })
                                    .with('staff')
                                    .fetch()
            
            var result = inventoryHistory.toJSON().sort((a,b) => moment(b.updated_at,timeFormat).unix() + moment(a.updated_at,timeFormat).unix())
                result.map( ( i, e ) => {
                    i.date = i.updated_at
                    i.name = i.inventory.name
                    i.status_id = i.status
                    i.staff = i.staff? i.staff.fullname:provider.fullname
                    i.status = `${Loging.STATUSCODE[i.status]}${i.refill? i.refill:''}`
                })

            return response.send(result)
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = InventoryController

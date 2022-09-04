'use strict'

const moment = use('moment')
const { timeFormat ,monthFormat, dateFormat} = require("../Helper")
const Utility = require("../Utility")

const Service = use('App/Models/Service')
const Inventory = use('App/Models/Inventory')

const FilterHelper = require('../FilterHelper.js')
const SumDailyRevenue = require('../SumDailyRevenue.js')
const Pos = require('../Pos.js')

class ServiceController {
    async get_services ({ response, request }) {
        const { service_ids } = request.body
        const now = moment().format(timeFormat)
        const scope = moment(now,timeFormat).add(15,'minutes').format(timeFormat)
        const services = await Service
            .query()
            .where('deleted',0)
            .whereIn('id', service_ids)
            .with('matches', (match) => {
                match.where('cancel', 0)
                match.whereNot('time_end','<=', now)
                match.orWhere(function() {
                    this.where('time_start','<=',now)
                    this.andWhere('time_end','>',now)
                })
                match.orWhere(function() {
                    this.whereBetween('time_start',[now,scope])
                })
            })
            .with('provider_sport.sport')
            .fetch()

        const result = services.toJSON().map(service => service = {
            id: service.id,
            name: service.name,
            price: service.price,
            icon: service.icon,
            total: service.limit_amount,
            sport: service.provider_sport.sport,
            countable: service.limit,
            available: service.limit? service.limit_amount-service.matches.length:0,
            servings: service.matches
        })

        return response.send(result)
    }

    async update_service ({ response, request, params }) {
        try {
            const service = await Service.find(params.id)
            await service.merge(request.body)
            await service.save()

            return response.send({ status: 'success', updated: service})
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async create_service ({ response, request, auth }) {
        try {
            const service = await Service.create(request.body)
            return response.send({ status: 'success', created: service})
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }
    async remove_service ({ response, request, auth,params }) {
        try {
            const service = await Service.find(params.service_id)
            service.deleted = true
            await service.save()

            return response.send({ status: 'success', removed: service})
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }
    async get_service_provider({response, request, auth,params }){
        try {
            const provider = await auth.getUser()
            const result = await FilterHelper.Filter.serviceDateTime(provider.id, params.datetime,monthFormat)
            return response.send(result)
        } catch (err) {
            return response.send({ status: 'fail', error: err.toString()})
        }
    }
    async get_filter_date({response, request, auth,params }){
        try {
            const provider = await auth.getUser()
            const result = await FilterHelper.Filter.serviceDateTime(provider.id, params.datetime, dateFormat)
            return response.send(result)
        } catch (err) {
            return response.send({ status: 'fail', error: err.toString()})
        }
    }
    
    async get_service_for_use({response,request,auth}){
        const {time_start,time_end,provider_sport_id} = request.body
        try{
            const provider = await auth.getUser();

            //service
            const services = await Service
            .query()
            .where('deleted', 0)
            .whereHas('provider_sport',(sp)=> {
                sp.where('id',provider_sport_id)
             })
             .with('match_services',(ms)=>{
               ms.with('match')
            })
             .fetch()

             var result_services = services.toJSON()
             result_services.map(i => {
                i.match_services = i.match_services.filter(ms=> {
                    if(ms.match){
                      return  ms.match.cancel == 0 &&
                        (ms.match.time_start  >= time_start && ms.match.time_end <= time_end ||
                        ms.match.time_end  >= time_start && ms.match.time_start <= time_end )
                    }else{
                        return ms.match == null
                    }
                })
                return i
            }); 
            result_services = result_services.map(service =>  {
                let usingTotal = 0;
                usingTotal = service.match_services.filter(ms=>{
                    return  ms.match != null
                 }).reduce(
                            (previousValue, currentValue) => previousValue + currentValue.amount
                             ,0
                    )
                return service = { 
                    id: service.id,
                    type: 'service',
                    name: service.name,
                    price: service.price,
                    limit: service.limit-usingTotal,
                    icon: service.icon
                }
            })

            //inventory
            const inventories = await Inventory
            .query()
            .where('remove',0)
            .where('provider_id',provider.id)
            .with("item_type")
            .with('used_inventory',ui=>{
                ui.with('match')
            })
            .with('inventory_histories')
            .fetch()
             
            var result_inventory = inventories.toJSON()      
            result_inventory.map(i => {
                i.used_inventory = i.used_inventory.filter((ui)=> !ui.match  || ui.match.cancel == 0) 
            });
            
            result_inventory = result_inventory.map(inventory =>  {
                inventory.totalAmount = 0;
                inventory.inventory_histories.map(history=>{
                    if(history.status == 3 || history.status == 4){
                        inventory.totalAmount = inventory.totalAmount+history.refill
                    }
                    if(history.status == 5 ){
                        inventory.totalAmount =  inventory.totalAmount-history.refill
                    }
                })
                inventory.use = 0;
                inventory.used_inventory.map(used=>{
                    inventory.use = inventory.use+used.amount
                   
                })
                return inventory = { 
                    id: inventory.id,
                    group: inventory.item_type,
                    barcode: inventory.barcode,
                    name: inventory.name,
                    price: inventory.price,
                    limit: inventory.totalAmount- inventory.use,
                    icon: inventory.icon,
                    item_type: inventory.item_type,
                    barcode: inventory.barcode
                }
            })
             return response.send([{type:'service',name:"อุปกรณ์",services:result_services},
             {type:'inventory',name:"สินค้า",services:result_inventory}])
        }catch(err){
            return response.send({ status: 'fail', error: err.toString()})
        }
    }
    async by_service ({response,request,auth}){
       const {inventories, created_at, payment_status, discount, staff_id} = request.body
       
       try {
        const provider = await auth.getUser()
        const {create_used, receipt} =  await Pos.Creater.createReceipt({inventories, created_at, discount, provider, staff_id})
        const result =  await Pos.Updater.payReceipt({ids: [receipt.id], paid_amount: receipt.total_price, payment_status})

        return response.send({ status: 'success',create_used})
       } catch (err) {
        return response.send({ status: 'fail', error: err.toString()})
       }
    }

    async daily_service({response,request,auth}){
        const sp = await auth.getUser()
        var { time_start, time_end } = request.body

        try {
            const result = await SumDailyRevenue.Show.get_daily_service(time_start, time_end, sp)
            return response.send(result)
           } catch (err) {
            return response.send({ status: 'fail', error: err.toString()})
           }

    }
}

module.exports = ServiceController

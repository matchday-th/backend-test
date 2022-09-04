const Match = use('App/Models/Match')
const Inventory = use('App/Models/Inventory')
const UsedInventory = use('App/Models/UsedInventory')
const Receipt = use('App/Models/Receipt')
const PosPayment = use('App/Models/PosPayment')
const PaymentEtc = use('App/Models/PaymentEtc')
const moment = use('moment')

const { Validator, Mutator, Checker, Creator, Tools, Calculation } = require('./Utility.js')
const Helper  = require('./Helper.js');
const SumDailyRevenue = {
    Query: {
        async get_matches(time_start, time_end, sp, on_count){
            time_start = Validator.matchTimeInput(time_start, time_end)

            const matches = await Match
                            .query()
                            .where('cancel',0)
                            .whereBetween('time_end',[time_start,time_end])
                            .whereHas('court.court_type.provider_sport.provider',(p)=> {
                                p.where('id',sp.id)
                            })
                            .with('services')
                            .with('inventories.item_type')
                            .fetch()
        
          var result = Mutator.filter_share_match(matches.toJSON())                  
          result = result.map(match=>{
                match.services.map(service=>{
                    service.price = service.pivot.price
                    service.amount = service.pivot.amount
                    delete service.pivot
                    return service
                })
                match.inventories.map(inventory=>{
                    inventory.price = inventory.pivot.price
                    inventory.amount = inventory.pivot.amount
                    delete inventory.pivot
                    return inventory
                })
                return match
            })
            return result
        },
        async get_inventory_no_match(time_start,time_end,sp) {
            const inventory = await Inventory
                            .query()
                            .where('remove',0)
                            .where('provider_id',sp.id)
                            .with('used_inventory', (inventory)=>{
                                inventory.whereBetween('created_at',[time_start,time_end])
                                inventory.where('match_id',null)
                            })
                            .fetch()

            const inventories = []                
            inventory.toJSON().forEach(inventory=>{
                    inventory.used_inventory.forEach(ui =>{
                        inventories.push({id: inventory.id, name: inventory.name, amount: ui.amount, price: ui.price})
                                })
                    })                   
            return inventories
        },
         async getInventoryMatch(matches, { time_start, time_end, sp }){
            var inventories = []
            var pos = await UsedInventory
                                .query()
                                .whereBetween('created_at',[time_start, time_end])
                                .whereHas('inventory', i => {
                                    i.where('provider_id', sp.id)
                                })
                                .with('inventory')
                                .where('match_id', null)
                                .fetch()

            pos = pos.toJSON()
            pos.map(e => {
                const result = e.inventory
                result.amount = e.amount
                result.price = e.price
                result.created_at = e.created_at

                return result
            }).forEach(i => {
                inventories.push(i)
            })
            matches.forEach(match=>{
                match.inventories.forEach(inventorie=>{
                    inventories.push(inventorie)
                })
            })

            return inventories
        },
        async getReceipt(time_start,time_end,sp){
            try {
                var inventory = await Inventory
                                .query()
                                .where('provider_id', sp.id)
                                .with('used_inventory',(used)=>{
                                    used.whereBetween('created_at',[time_start,time_end])
                                })
                                .fetch()
                var used_inventory = inventory.toJSON().filter(f=>f.used_inventory.length>0).map(i=>i.used_inventory.map(used=>used.id))
                
                var used_ids = []
                used_inventory.forEach(used=>{
                    used.forEach(id=>{
                        used_ids.push(id)
                    })
                })

                var receipt = await Receipt
                                .query()
                                .whereIn('used_inventory_ids',used_ids)
                                .fetch()


                return receipt.toJSON()
            } catch (error) {
                console.log(error)
                return error
            }
        },
        async getPOSPayment(time_start, time_end, sp){
                var receipt = await SumDailyRevenue.Query.getReceipt(time_start,time_end,sp)
                var receipt_ids = receipt.map(r=>r.id)

                var payment = await PosPayment
                            .query()
                            .with('used_inventory')
                            .whereHas('used_inventory',(used)=>{
                                used.whereBetween('created_at',[time_start, time_end])
                                used.whereHas('inventory',(i)=>{
                                    i.where('provider_id', sp.id)
                                })
                            })
                            .orWhereIn('receipt_id',receipt_ids)
                            .fetch()
                payment = payment.toJSON()

            const offline = payment.filter(f=>f.payment_status == 'offline').reduce((a,b)=>a+b.paid_amount,0)
            const online = payment.filter(f=>f.payment_status == 'online').reduce((a,b)=>a+b.paid_amount,0)
            const credit = payment.filter(f=>f.payment_status == 'credit').reduce((a,b)=>a+b.paid_amount,0)
            return {offline, online, credit}
        },
        async getPaymentEtc(time_start, time_end, sp){
            const payment = await PaymentEtc
                            .query()
                            .where('provider_id',sp.id)
                            .whereBetween('created_at',[time_start, time_end])
                            .fetch()
            return payment.toJSON()
        }
    },
    Calculated: {
        sumServices(services) {
            var prices = []
            services.forEach(i=>{
                prices.push(i.amount*i.price) 

            })
            if (prices.length > 1) {
                return prices.reduce((a,b)=> a + b)
            } else if(prices.length == 1){
                return parseInt(prices[0],10)
            }else{
                return 0
            }
        },
        getHourAmount(matches){
            matches.map(match=>{
                match.hour = Helper.getDuration({time_start: match.time_start,time_end: match.time_end},'hours')
                return match
            })
            return  parseFloat(matches.map(({ hour })=> hour).reduce((a,b)=> a+b, 0).toFixed(0))
        },
        getMatchTotalPrice(matches){
            matches.map(match=>{
                match.service_price = SumDailyRevenue.Calculated.sumServices(match.services)
                match.inventory_price = SumDailyRevenue.Calculated.sumServices(match.inventories)
                match.total_price = match.total_price-(match.service_price+match.inventory_price)
                return match
            })

            return parseFloat(matches.map(({ total_price }) => total_price).reduce((a,b)=> a+b, 0).toFixed(0))
        },
        getServicesSummary(services){
            var results = [];
            const lastest = function (id) {
                const res = services.filter(s => s.id == id).sort((a,b) => moment(b.created_at).unix() - moment(a.created_at).unix())[0]
                return res.created_at
            }
            services.reduce(function(res, value) {
            if (!res[value.id]) {
                res[value.id] = { id: value.id, name:value.name, amount: 0 ,price: 0, total_price: 0};
                results.push(res[value.id])
            }
                res[value.id].amount += value.amount;
                res[value.id].price = value.price;
                res[value.id].total_price += value.price*value.amount;
                res[value.id].created_at = lastest(value.id)
            return res;
            }, {});

            const total_price = results.reduce((a,b)=>a+b.total_price, 0)
            return {results, total_price}
        },
        getServiceMatch(matches){
            var services = []
            matches.forEach(match=>{
                match.services.forEach(service=>{
                    services.push(service)
                })
            })
            return services
        },
        async getInventory({ time_start, time_end, sp }){
            var inventories = []
            var pos = await UsedInventory
                                .query()
                                .whereBetween('created_at',[time_start, time_end])
                                .whereHas('inventory', i => {
                                    i.where('provider_id', sp.id)
                                })
                                .with('inventory')
                                .fetch()

            pos = pos.toJSON()
            pos.map(e => {
                const result = e.inventory
                result.amount = e.amount
                result.price = e.price

                return result
            }).forEach(i => {
                inventories.push(i)
            })

            return inventories
        },
        getSumTotalPrice(service_total_price, inventory_total_price, match_total_price){
            return service_total_price + inventory_total_price + match_total_price 
        },
        async getMatchUnpaidPrice(matches){
            for(i in matches){
                matches[i].inventories.forEach(inventory => {
                    inventory.pivot = {price: inventory.price, amount: inventory.amount}
                    return inventory
                })
                matches[i].services.forEach(service => {
                    service.pivot = {price: service.price, amount: service.amount}
                    return service
                })
                matches[i].total_price = await Calculation.recheck_match_total_price(matches[i],matches[i].total_price)
            }

            var total_price = matches.map(m => m.total_price).reduce((a,b)=>a+b,0)
            var total_paid = matches.map(m => m.paid_amount).reduce((a,b)=>a+b,0)

            return total_price - total_paid
        },
        getPOSUnpaidPrice(receipt){
            var total_price = receipt.map(r => r.total_price).reduce((a,b)=> a+b,0)
            var total_paid = receipt.map(r => r.total_paid).reduce((a,b)=> a+b,0)

            return total_price - total_paid
        },
        getMatchPayment(matches){
            var paid_online = 0
            var paid_offline = 0
            var paid_credit = 0
            matches.forEach(m=>{
                try {
                    const payment = JSON.parse(m.payment);
                    if(payment.type == 'online'){
                        paid_online += m.paid_amount
                    }else{
                        if(m.payment_status == 'online'){
                            paid_online += m.paid_amount
                        }else if(m.payment_status == 'offline'){
                            paid_offline += m.paid_amount
                        }else if(m.payment_status == 'credit'){
                            paid_credit += m.paid_amount
                        }else{

                        }
                    }
                } catch (error) {
                    if(m.payment_status == 'online'){
                        paid_online += m.paid_amount
                    }else if(m.payment_status == 'offline'){
                        paid_offline += m.paid_amount
                    }else if(m.payment_status == 'credit'){
                        paid_credit += m.paid_amount
                    }else{

                    }
                }
            })
            return {paid_offline, paid_online, paid_credit}
        },
        getCostTotal(payment_etc){
            return payment_etc.reduce((a,b)=> a+(b.price*b.amount),0)
        },
        getDiscount(receipts){
            var price = receipts.reduce((a,b)=> a+b.discount,0)
            return price
        }
    },
    Show: {
        async get_daily_revenue(time_start, time_end, sp, on_count){
        const matches = await SumDailyRevenue.Query.get_matches(time_start, time_end, sp, on_count)
        const receipt = await SumDailyRevenue.Query.getReceipt(time_start, time_end, sp)

        const services = SumDailyRevenue.Calculated.getServiceMatch(matches)
        const inventories = await SumDailyRevenue.Query.getInventoryMatch(matches, { time_start, time_end, sp })

        const service_summary = SumDailyRevenue.Calculated.getServicesSummary(services)
        const inventory_summary= SumDailyRevenue.Calculated.getServicesSummary(inventories)
        const match_total_price = SumDailyRevenue.Calculated.getMatchTotalPrice(matches)

        const match_unpaid_price = await SumDailyRevenue.Calculated.getMatchUnpaidPrice(matches)
        const pos_unpaid_price =  SumDailyRevenue.Calculated.getPOSUnpaidPrice(receipt)

        const pos_paid = await SumDailyRevenue.Query.getPOSPayment(time_start, time_end, sp)
        const match_paid =  SumDailyRevenue.Calculated.getMatchPayment(matches)

        const payment_etc = await SumDailyRevenue.Query.getPaymentEtc(time_start, time_end, sp)
        const cost_total = await SumDailyRevenue.Calculated.getCostTotal(payment_etc)

        const discount_price = SumDailyRevenue.Calculated.getDiscount(receipt)

        const total_unpaid = match_unpaid_price + pos_unpaid_price
        const total_price = SumDailyRevenue.Calculated.getSumTotalPrice(service_summary.total_price , inventory_summary.total_price, match_total_price) - total_unpaid - cost_total - discount_price

        const daily_revenue = {
              service:{
                services: service_summary.results,
                total_price: service_summary.total_price,
              },
              inventory:{
                inventories: inventory_summary.results,
                total_price: inventory_summary.total_price,
              },
              match:{
                hour_amount: SumDailyRevenue.Calculated.getHourAmount(matches),
                match_amount: matches.length,
                total_price: match_total_price,
              },
              total_unpaid: total_unpaid,
              total_price: total_price,
              payment_offline: pos_paid.offline + match_paid.paid_offline,
              payment_online: pos_paid.online + match_paid.paid_online,
              payment_credit: pos_paid.credit + match_paid.paid_credit,
              cost_total: cost_total,
              discount_prices: discount_price
          }
          return daily_revenue
        },
        async get_daily_service(time_start, time_end, sp){
            const receipt = await SumDailyRevenue.Query.getReceipt(time_start, time_end, sp)    
            const pos_unpaid_price = SumDailyRevenue.Calculated.getPOSUnpaidPrice(receipt)

            const inventory = await SumDailyRevenue.Query.get_inventory_no_match(time_start, time_end, sp)
            const inventory_summary= SumDailyRevenue.Calculated.getServicesSummary(inventory)

            const pos_paid = await SumDailyRevenue.Query.getPOSPayment(time_start, time_end, sp)

            const payment_etc = await SumDailyRevenue.Query.getPaymentEtc(time_start, time_end, sp)
            const cost_total = await SumDailyRevenue.Calculated.getCostTotal(payment_etc)

            const discount_price = SumDailyRevenue.Calculated.getDiscount(receipt)

            const result = {
                inventory:{
                  inventories: inventory_summary.results,
                  total_price: inventory_summary.total_price,
                },
                total_price: inventory_summary.total_price - pos_unpaid_price - cost_total - discount_price,
                total_unpaid: pos_unpaid_price,
                payment_offline: pos_paid.offline,
                payment_online: pos_paid.online,
                payment_credit: pos_paid.credit,
                cost_total: cost_total,
                discount_prices: discount_price
            }
            return result
        }
    }
}
module.exports = SumDailyRevenue;
const moment = use('moment')
const Utility = require('./Utility.js');
const Helper = require('./Helper.js');

const timeFormat = 'YYYY-MM-DD HH:mm:ss'

const Inventory = use('App/Models/Inventory')
const Service = use('App/Models/Service')

const FilterHelper = {
    Filter :{
        async inventoryDatetime(provider_id, datetime, datetime_format){
            const inventory = await Inventory
                .query()
                .where('remove',0)
                .where('provider_id',provider_id)
                .with('item_type')
                .with('inventory_histories')
                .with('used_inventory',(u)=>{
                    u.with('match')
                })
                .fetch()

            var result = inventory.toJSON()      
            result.map(i => {
                i.used_inventory = i.used_inventory.filter((ui)=> !ui.match  || ui.match.cancel == 0) 
            });

            result = result.map(i=>{
                i.remaining = 0
                i.income = 0
                i.use = 0
                i.totalAmount  = 0
                i.inventory_histories.map(history=>{
                    if(history.status == 3 || history.status == 4){
                        i.totalAmount = i.totalAmount + parseFloat(history.refill)

                    }
                    if(history.status == 5 ){
                        i.totalAmount = i.totalAmount - parseFloat(history.refill)
                    }
                })
                i.used_inventory.map(used=>{
                    i.income = i.income+(used.price*used.amount)
                    i.use = i.use+used.amount
                
                })
                i.remaining = ( i.totalAmount- i.use)

                var income_of_mounth = 0
                var use_of_mounth = 0
                var use_total = 0
                i.used_inventory.map(used=>{
                    var uses_date = moment(used.created_at).format(datetime_format)
                    var date = moment(datetime).format(datetime_format)

                    var uses_date_x = moment(used.created_at).unix()
                    var date_x = moment(datetime).unix()

                    if(uses_date==date){
                        income_of_mounth= income_of_mounth+(used.price*used.amount)
                        use_of_mounth = use_of_mounth+used.amount
                    }
                    
                    if (uses_date_x <= date_x) use_total = use_total + used.amount
                    if (!used.created_at) use_total = use_total + used.amount
                })

                var refill_of_month = 0
                i.inventory_histories.map(history=>{
                    var uses_date = moment(history.created_at).unix()
                    var date = moment(datetime).unix()
                    if(uses_date == date){
                        if(history.status == 3 || history.status == 4){
                            refill_of_month = refill_of_month + parseFloat(history.refill)

                        }
                        if(history.status == 5 ){
                            refill_of_month = refill_of_month - parseFloat(history.refill)
                        }
                    }
                })

                i.left_of_month = 0
                i.inventory_histories.map(history=>{
                    var uses_date = moment(history.created_at).unix()
                    var date = moment(datetime).unix()
                    if (uses_date <= date) {
                        if(history.status == 3 || history.status == 4){
                            i.left_of_month = i.left_of_month + parseFloat(history.refill)

                        }
                        if(history.status == 5 ){
                            i.left_of_month = i.left_of_month - parseFloat(history.refill)
                        }
                    }
                })

                i.left_of_month = ( i.left_of_month - use_total)
                i.income = income_of_mounth
                i.use = use_of_mounth
                i.refill_of_month = refill_of_month

                delete i.inventory_histories
                delete i.used_inventory
                return i
            })
            return result
        },
        /* Pre use */
        // async inventoryDatetime(provider_id, datetime, datetime_format){
        //     try {
        //         console.time('inventoryDatetime')
        //         console.time('Query: inventoryDatetime')
        //             const inventory = await Inventory
        //                 .query()
        //                 .where('remove',0)
        //                 .where('provider_id',provider_id)
        //                 .with('item_type')
        //                 .with('inventory_histories',(u)=>{
        //                     u.where('created_at','LIKE',`%${datetime}%`)
        //                 })
        //                 .with('used_inventory',(u)=>{
        //                     u.where('created_at','LIKE',`%${datetime}%`)
        //                     u.with('match')
        //                 })
        //                 .fetch()

        //         console.log(datetime);
        //         console.timeEnd('Query: inventoryDatetime')

        //         var result = inventory.toJSON()      
        //         result.map(i => {
        //             i.used_inventory = i.used_inventory.filter((ui)=> !ui.match  || ui.match.cancel == 0) 
        //         });

        //         result = result.map(i=>{
        //             i.remaining = 0
        //             i.income = 0
        //             i.use = 0
        //             i.totalAmount  = 0
        //             i.inventory_histories.map(history=>{
        //                 if(history.status == 3 || history.status == 4){
        //                     i.totalAmount = i.totalAmount + parseFloat(history.refill)

        //                 }
        //                 if(history.status == 5 ){
        //                     i.totalAmount = i.totalAmount - parseFloat(history.refill)
        //                 }
        //             })
        //             i.used_inventory.map(used=>{
        //                 i.income = i.income+(used.price*used.amount)
        //                 i.use = i.use+used.amount
                    
        //             })
        //             // i.remaining = ( i.totalAmount- i.use)
        //             i.remaining = i.remaining_amount

        //             var income_of_mounth = 0
        //             var use_of_mounth = 0
        //             var use_total = 0
        //             i.used_inventory.map(used=>{
        //                 var uses_date = moment(used.created_at).format(datetime_format)
        //                 var date = moment(datetime).format(datetime_format)

        //                 var uses_date_x = moment(used.created_at).unix()
        //                 var date_x = moment(datetime).unix()

        //                 if(uses_date==date){
        //                     income_of_mounth= income_of_mounth+(used.price*used.amount)
        //                     use_of_mounth = use_of_mounth+used.amount
        //                 }
                        
        //                 if (uses_date_x <= date_x) use_total = use_total + used.amount
        //                 if (!used.created_at) use_total = use_total + used.amount
        //             })

        //             var refill_of_month = 0
        //             i.inventory_histories.map(history=>{
        //                 var uses_date = moment(history.created_at).unix()
        //                 var date = moment(datetime).unix()
        //                 if(uses_date == date){
        //                     if(history.status == 3 || history.status == 4){
        //                         refill_of_month = refill_of_month + parseFloat(history.refill)

        //                     }
        //                     if(history.status == 5 ){
        //                         refill_of_month = refill_of_month - parseFloat(history.refill)
        //                     }
        //                 }
        //             })

        //             i.left_of_month = 0
        //             // i.inventory_histories.map(history=>{
        //             //     var uses_date = moment(history.created_at).unix()
        //             //     var date = moment(datetime).unix()
        //             //     if (uses_date <= date) {
        //             //         if(history.status == 3 || history.status == 4){
        //             //             i.left_of_month = i.left_of_month + parseFloat(history.refill)

        //             //         }
        //             //         if(history.status == 5 ){
        //             //             i.left_of_month = i.left_of_month - parseFloat(history.refill)
        //             //         }
        //             //     }
        //             // })

        //             i.income = income_of_mounth
        //             i.use = use_of_mounth

        //             i.left_of_month = ( i.left_of_month - use_total)
        //             i.refill_of_month = refill_of_month

        //             delete i.inventory_histories
        //             delete i.used_inventory
        //             return i
        //         })
        //         console.timeEnd('inventoryDatetime');

        //     return result
        //     } catch (err) {
        //         console.log(err);
        //     }
        // },
        async serviceDateTime(provider_id, datetime, datetime_format){

            const now = moment().format(timeFormat)
            var date = moment(datetime).format(datetime_format)

            const services = await Service
            .query()
            .where('deleted', 0)
            .whereHas('provider_sport',(sp)=> {
                sp.where('provider_id',provider_id)
             })
            .with('match_services',(ms)=>{
                ms.where('created_at','LIKE', `%${date}%`)//filter yyyy-MM
                ms.with('match')
            })
            .fetch()

            var result = services.toJSON()
            result.map(i => {
                i.match_services.map(ms=>{
                    ms.match_end = false
                    if(ms.match){
                        if((ms.match.cancel == 0) && (ms.match.time_start<=now && ms.match.time_end<now)){
                            ms.match_end = true
                        }
                    }
                    return ms
                })
                return i
            });
            result = result.map(service => {
                let usingTotal = 0;
                let income = 0;
                usingTotal = service.match_services.filter(ms=>{
                        return  ms.match_end == false
                     }).reduce(
                            (previousValue, currentValue) => previousValue + currentValue.amount
                             ,0
                    )

                    var match_services_end = service.match_services.filter(ms=>{
                        return  ms.match_end == true
                     })

                     let service_used = match_services_end.reduce((a,b)=>a+b.amount,0)

                    income = match_services_end.reduce((a,b)=>a+(b.amount*b.price),0)

                return service = { 
                    id: service.id,
                    provider_sport_id: service.provider_sport_id,
                    name: service.name,
                    price: service.price,
                    icon: service.icon,
                    used: service_used,
                    using: usingTotal,
                    total: service.limit,
                    income: income,
                    match_end: match_services_end
                }
            })
            return result
        }
    }
}
module.exports = FilterHelper;
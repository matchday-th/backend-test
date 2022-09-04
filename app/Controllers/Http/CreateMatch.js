const moment = use('moment')
const dateFormat = 'D MMM Y'
const timeFormat = 'HH:mm'
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
const Utility = require('./Utility.js');
const Helper = require('./Helper.js');
const { query } = require('express');

const Court = use('App/Models/Court')
const Room = use('App/Models/Room')
const Match = use('App/Models/Match')
const CourtType = use('App/Models/CourtType')

const CreateMatch = {
    Slip: {
        async match_slip(match) {

            var court_prices =  match.court_type_id ? 
            await  CreateMatch.Calculate.cal_court_type_price({court_type_id: match.court_type_id, time_start:match.time_start, time_end:match.time_end, fixed_price:match.fixed_price}) :
            await  CreateMatch.Calculate.cal_court_price({court_ids:match.courts, time_start:match.time_start, time_end:match.time_end, fixed_price:match.fixed_price})
            
            var service_prices = CreateMatch.Calculate.cal_service_price({services:match.services, inventories:match.inventories})
            var total_price = match.settings.type == 'gs'? service_prices.total_service_price : court_prices.total_court_price+service_prices.total_service_price
            var total_court_price = `${court_prices.total_court_price.toLocaleString()} ฿`

            var date = moment(match.time_start).locale('th').format(dateFormat); 
            var time_start = moment(match.time_start).locale('th').format(timeFormat); 
            var time_end = moment(match.time_end).locale('th').format(timeFormat); 
            var time = `${time_start}-${time_end} น.`
            var court_names = court_prices.court_prices.map(cp=>cp.name).join(", ")
            var sport_name = court_prices.sport.name
            var match_type = (match.longbook !=null || match.longbook>0)?'จองต่อเนื่อง' :(match.settings.type == 'gs')? 'ก๊วน':'ปกติ'

            var services = service_prices.all_services.map(s=>s={
                text: `${s.name} ${s.price.toLocaleString()} บาท/หน่วย: ${s.amount.toLocaleString()} หน่วย`,
                price: `${s.total_price.toLocaleString()} ฿`
            })

            var payment_method = 'ผ่านสนาม'
            var payment_status = 'ค้างชำระ'
            var longbook = (match.longbook)?`${match.longbook.days} สัปดาห์`:null
            var contacts = (match.contacts)?match.contacts:[]

            var total_price = `${total_price.toLocaleString()} ฿`
            var body = {name:match.settings.name, tel:match.settings.tel, date,time, court_names, match_type, total_court_price, fixed_price: match.fixed_price, group_price_name:match.group_price_name, sport_name ,services, longbook, contacts, payment_method, payment_status, total_price}
           return body
        }, 
    },
    Calculate:{
        async cal_court_price({court_ids, time_start, time_end, fixed_price}) {
            const courts = await Court
                .query()
                .whereIn('id', court_ids)
                .with('court_type', (ct) => {
                    ct.with('period_price')
                    ct.with('fixed_times')
                    ct.with('time_slots.slot_prices')
                    ct.with('provider_sport.sport')
                })
                .fetch()

            var sport = courts.toJSON()[0].court_type.provider_sport.sport

            const court_prices = courts.toJSON().map(court => {
                court.price = Helper.cal_PeriodPrice({
                    period_prices: court.court_type.period_price,
                    time_start,
                    time_end,
                    price_court: court.court_type.price,
                    time_slots: court.court_type.time_slots,
                    free_hour: court.court_type.free_hour
                })
                delete court.court_type
                return court
            })

            var total_court_price = court_prices.reduce(
                (previousValue, currentValue) => previousValue + currentValue.price
                , 0
            )

            if(fixed_price || fixed_price == 0){
                total_court_price = CreateMatch.Calculate.cal_fixed_price(fixed_price,time_start,time_end)
            }

            var request_body = {court_prices, total_court_price, sport}
            return request_body
        },
        async cal_court_type_price({court_type_id, time_start, time_end, fixed_price}) {
            const courtType = await CourtType
                .query()
                .where('id', court_type_id)
                .with('period_price')
                .with('fixed_times')
                .with('time_slots.slot_prices')
                .with('provider_sport.sport')
                .fetch()
            
            var sport = courtType.toJSON()[0].provider_sport.sport
               
            const court_prices = courtType.toJSON().map(court_type => {
                court_type.price = Helper.cal_PeriodPrice({
                    period_prices: court_type.period_price,
                    time_start,
                    time_end,
                    price_court: court_type.price,
                    time_slots: court_type.time_slots,
                    free_hour: court_type.free_hour
                })

                return court_type
            })

            var total_court_price = court_prices.reduce(
                (previousValue, currentValue) => previousValue + currentValue.price
                , 0
            )

            if(fixed_price || fixed_price == 0){
                total_court_price = CreateMatch.Calculate.cal_fixed_price(fixed_price,time_start,time_end)
            }

            var request_body = {court_prices, total_court_price, sport}
            return request_body
        },
        cal_service_price({services,inventories}){
            var total_service_price = 0
            if (services) {
                services = services.map(s=>{
                    s.total_price =  s.pivot? s.pivot.amount*s.pivot.price: s.amount*s.price
                    return s
                })
            }

            if (inventories) {
                inventories= inventories.map(i=>{
                    i.total_price =  i.pivot? i.pivot.amount*i.pivot.price : i.amount*i.price
                    return i
                })
            }
            var all_services = []
            all_services = [...services,...inventories]
            if (all_services.length > 0){
                if (all_services.length > 1) {
                    total_service_price = all_services.reduce(
                        (a, b) => a + b.total_price
                         ,0
                )
                } else {
                    total_service_price = parseInt(all_services[0].total_price,10)
                }
            }

            var request_body = {all_services,total_service_price}
            return request_body
        },
        cal_fixed_price(fixed_price,time_start,time_end){
            time_start = CreateMatch.Calculate.getTimeDefault(time_start,time_end);    

            var duration = moment.duration(moment(time_end).diff(moment(time_start)));
            var hours = duration.asHours();
            return fixed_price*hours
        },
        getTimeDefault(time_start, time_end) {
            var rule_1 = moment(time_end,dateTimeFormat).diff(moment(time_start,dateTimeFormat),'minutes')
            return (parseInt(rule_1,10)%30 != 0)? moment(time_start,dateTimeFormat).subtract(1,'minutes').format(dateTimeFormat):time_start
        },
        getMatchPrice(match){
            const sum_services = match.services.map(s => s.pivot.price*s.pivot.amount).reduce((a,b)=>a+b,0)
            const sum_inventories = match.inventories.map(s => s.pivot.price*s.pivot.amount).reduce((a,b)=>a+b,0)
            var match_price = match.total_price - (sum_services+sum_inventories)
            return match_price
        },
        async getSumPricePlayer(match_id, match_price){
            const rooms = await Room
                            .query()
                            .where('match_id', match_id)
                            .fetch()
            const sum_price_player = rooms.toJSON().reduce((a,b) => a+b.paid_ticket,0)
            return sum_price_player
        }
    },
    AutoUpdate :{
        async update_match_price(match_id){
            const match = await Match.find(match_id)
            await match.loadMany(['inventories','services'])
            const {services, inventories, fixed_price, change_price, match_price, time_start, time_end, room_switch} = match.toJSON()
            const {total_service_price} = CreateMatch.Calculate.cal_service_price({services, inventories})
            const sum_price_player = await CreateMatch.Calculate.getSumPricePlayer(match_id)
            const price = change_price ? change_price : fixed_price ? CreateMatch.Calculate.cal_fixed_price(fixed_price, time_start, time_end) : match_price
            const gs = room_switch == 1 && !match.user_id

            match.total_price =  gs ? total_service_price + sum_price_player :  price + total_service_price
            await match.save()
        }
    }


}
module.exports = CreateMatch;
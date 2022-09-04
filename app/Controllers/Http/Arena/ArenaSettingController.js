'use strict'

const Provider = use('App/Models/Provider')
const Sports = use('App/Models/Sport')
const CourtType = use('App/Models/CourtType')
const TimeSlot = use('App/Models/TimeSlot')
const SlotPrice = use('App/Models/SlotPrice')
const Court = use('App/Models/Court')
const ProviderSport = use('App/Models/ProviderSport')
const Match = use('App/Models/Match')
const moment = use('moment')
const { timeFormat } = require('../Helper.js')
const { Validator, Checker, Mutator } = require('../Utility.js')

const ArenaSetting = require('../ArenaSetting.js')

class ArenaSettingController {
    async def_sport({ response, request, auth }) {
        const provider = await auth.getUser()
        var all_sports = await Sports.all()
        all_sports = all_sports.toJSON()
        var my_sports = await ProviderSport
            .query()
            .where('provider_id',provider.id)
            .with('sport')
            .with('court_types', (builder) => builder.withCount('courts as courts'))
            .fetch()
        my_sports = my_sports.toJSON()
        my_sports = my_sports.map(ps => {
            return {
                provider_sport_id: ps.id,
                sport_name: ps.sport.name,
                sport_id: ps.sport.id,
                courts: (ps.court_types.length>1)? ps.court_types.map(ct => ct = ct.__meta__.courts).reduce((a,b)=> a+b):ps.court_types.map(ct => ct = ct.__meta__.courts)[0]
            }
        })
        const my_sport_id = my_sports.map(ms => ms = ms.sport_id)
        var result = []
        for (var i=0;i<all_sports.length;i++) {
            if (!my_sport_id.includes(all_sports[i].id)) {
                result.push({
                    name: all_sports[i].name,
                    value: {
                        type: 'sport_id',
                        id: all_sports[i].id
                    }
                })
            }
        }
        my_sports.forEach(sport => {
            result.push({
                name: `${sport.sport_name} (${sport.courts} สนาม)`,
                value: {
                    type: 'provider_sport_id',
                    id: sport.provider_sport_id
                }
            })
        })
        
        return response.send(result)
    }

    async create_court_type({ response, request, auth }) {
        try {
            const {
                sport_value,
                court_type_name,
                court_type_type,
                court_type_price,
                max_team_size,
                time_slots,
                courts,
                mode,
                court_price,
                update
            } = request.body
            ///mode:
            /// 1: court
            /// 2: full court
            /// 3: full court form old court
            const court_type_amount = (mode == 2 || mode == 3) ? courts.amount : 1
            const price_court = (mode == 2) ? court_price : court_type_price

            const provider = await auth.getUser()
            var provider_sport;
            if (sport_value.type == 'sport_id') {
                provider_sport = await ProviderSport
                    .create({ 
                        provider_id: provider.id,
                        sport_id: sport_value.id
                    })
            } else {
                provider_sport = sport_value
            }
            
            var created_court_types = []
            var created_TimeSlots = []
            if(mode==1 || mode== 2){
                for(var i=0;i<court_type_amount;i++) {
                    var court_type = await CourtType
                    .create({
                        provider_sport_id: provider_sport.id,
                        name: `${court_type_name} ${mode == 2? courts.number_format? (parseFloat(courts.start_at)+i):Mutator.number_to_alphabet(parseFloat(courts.start_at)+i):''} สนามย่อย`,
                        type: court_type_type,
                        max_team_size: max_team_size,
                        price: price_court
                    })
                    created_court_types.push(court_type)
                }
    
                for(var j=0;j<created_court_types.length;j++){
                    for (var i=0;i<time_slots.length;i++) {
                        const time_slot = await TimeSlot
                            .create({
                                court_type_id: created_court_types[j].id,
                                days: time_slots[i].days,
                                open_time: time_slots[i].open_time,
                                close_time: Validator.time_slot_close_time(time_slots[i].open_time,time_slots[i].close_time)
                            })
                        created_TimeSlots.push(time_slot)
                }}
    
                var created_Courts = []
                const court_amount = mode==2 ? 2 : courts.amount
                let court_index = 0
                for(var j=0;j<created_court_types.length;j++){
                    for (var i=0;i<court_amount;i++) {
                        const court = await Court
                            .create({
                                court_type_id: created_court_types[j].id,
                                name: `${courts.name} ${courts.number_format? (parseFloat(courts.start_at)+court_index):Mutator.number_to_alphabet(parseFloat(courts.start_at)+court_index)}`,
                                price: price_court
                            })
                        court_index++;
                        created_Courts.push(court)
                    }
                }
            }
           

            //CREATE FULL COURT
            var created_full_court = []
            var share_court = []
            const amount_share_court = 2
            if((mode == 2 || mode == 3)){
                for(var i=0;i<court_type_amount;i++) {
                    var court_type = await CourtType
                    .create({
                        provider_sport_id: provider_sport.id,
                        name: `${court_type_name} ${courts.number_format? (parseFloat(courts.start_at)+i):Mutator.number_to_alphabet(parseFloat(courts.start_at)+i)} เต็มสนาม`,
                        type: court_type_type,
                        max_team_size: max_team_size,
                        price: court_type_price,
                        share_court: 1
                    })
                    created_full_court.push(court_type)
                }
    
                for(var j=0;j<created_full_court.length;j++){
                    for (var i=0;i<time_slots.length;i++) {
                        const time_slot = await TimeSlot
                            .create({
                                court_type_id: created_full_court[j].id,
                                days: time_slots[i].days,
                                open_time: time_slots[i].open_time,
                                close_time: Validator.time_slot_close_time(time_slots[i].open_time,time_slots[i].close_time)
                            })
                        created_TimeSlots.push(time_slot)
                }}
    
                if(mode == 2){
                    for(var i=0;i<created_full_court.length;i++) {
                        for(var j=0;j<amount_share_court;j++) {
                                const data = {sub_court_type_id: created_full_court[i].id}
                                // console.log({data, index: j, court_id: created_Courts[j].id})
                                const update_court = await ArenaSetting.Update.update_court({court_id: created_Courts[j].id, data})
                                share_court.push(update_court)
                        }
                        created_Courts = created_Courts.splice(amount_share_court)
                    }
                }else if(mode ==3){
                    for(var i=0;i<created_full_court.length;i++) {
                        for(var j=0;j<amount_share_court;j++) {
                                const data = {sub_court_type_id: created_full_court[i].id}
                                const update_court = await ArenaSetting.Update.update_court({court_id: update.courts[j].id, data})
                                share_court.push(update_court)
                        }
                        update.courts = update.courts.splice(amount_share_court)
                    }
                }
            }

            return response.send({status: 'success', actions: {
                provider_sport,
                created_court_types,
                created_Courts,
                created_TimeSlots,
                created_full_court,
                share_court
            }})
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async update_court_type({ response, request, auth }) {
        try {
            const {
                court_type,
                time_slots,
                courts,
                edit_time_slots,
                edit_courts,
            } = request.body
            
            var deleted_CourtType = []
            const update_CourtType = await CourtType.find(court_type.id)
            await update_CourtType.merge(court_type)
            await update_CourtType.save()

            ///court
            const court = await Court.query().where('court_type_id', court_type.id).first()
            if(court && court.sub_court_type_id){
                const update_ShareCourtType = await CourtType.find(court.sub_court_type_id)
                await update_ShareCourtType.merge({type: update_CourtType.type})
                await update_ShareCourtType.save()
            }


            if (court_type.delete) {
                for (var i=0;i<court_type.delete.length;i++) {
                    const delete_CourtType = await CourtType.find(court_type.delete[i])
                    await delete_CourtType.delete()
                    deleted_CourtType.push(delete_CourtType)
                }
            }

            var action_TimeSlots = []
            if (edit_time_slots) {
                if (edit_time_slots.create) {
                    for (var i=0;i<edit_time_slots.create.length;i++) {
                        const created_TimeSlots = await TimeSlot.create({
                            court_type_id: court_type.id,
                            days: edit_time_slots.create[i].days,
                            open_time: edit_time_slots.create[i].open_time,
                            close_time: Validator.time_slot_close_time(edit_time_slots.create[i].open_time,edit_time_slots.create[i].close_time)
                        })

                        action_TimeSlots.push({ created: created_TimeSlots})
                    }
                } 
                if (edit_time_slots.delete) {
                    for (var i=0;i<edit_time_slots.delete.length;i++) {
                        const update_TimeSlot = await TimeSlot.find(edit_time_slots.delete[i])
                        await update_TimeSlot.delete()
                        
                        action_TimeSlots.push({ deleted: update_TimeSlot})
                    }
                }
            }
    
            var updated_TimeSlots = []
            for (var i=0;i<time_slots.length;i++) {
                const update_TimeSlot = await TimeSlot.find(time_slots[i].id)
                var { open_time, close_time } = time_slots[i]
                if (close_time) time_slots[i].close_time = Validator.time_slot_close_time(open_time, close_time)
                await update_TimeSlot.merge(time_slots[i])
                await update_TimeSlot.save()
                updated_TimeSlots.push(update_TimeSlot)
            }
            
            var action_Courts = []
            if (edit_courts) {
                if (edit_courts.create) {
                    for (var i=0;i<edit_courts.create.length;i++) {
                        const create_Court = await Court.create({
                            name:`${edit_courts.create[i].name}`,
                            price: court_type.price,
                            court_type_id: court_type.id,
                        })
                        action_Courts.push({ created: create_Court})
                    }
                }else if (edit_courts.delete) {
                    if (edit_courts.delete) {
                        for (var i=0;i<edit_courts.delete.length;i++) {
                            const delete_Court = await Court.find(edit_courts.delete[i])
                            await delete_Court.delete()
                            action_Courts.push(delete_Court)
                        }
                    }
                }
            }


            var updated_Courts = []
            for (var i=0;i<courts.length;i++) {
                const update_Court = await Court.find(courts[i].id)
                await update_Court.merge({
                    name:`${courts[i].name}`,
                    price: court_type.price
                })
                await update_Court.save()
                updated_Courts.push(update_Court)
            }

            return response.send({status: 'success', actions: {
                update_CourtType,
                deleted_CourtType,
                updated_TimeSlots,
                action_TimeSlots,
                updated_Courts,
                action_Courts,
            }})
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async delete_court_type({ response, request }) {
        try {
            const court_type_id = request.get().court_type_id
            const court_type = await CourtType.find(court_type_id)

            var courts = []
            try {
                if(court_type.share_court == 1){
                    const court = await Court
                    .query()
                    .where('sub_court_type_id',court_type_id)
                    .fetch()

                    court.toJSON().map(c => {
                        courts.push(c.id)
                    })

                    for(var i =0; i< courts.length; i++){
                      const update_court  = await Court.find(courts[i])
                      update_court.merge({sub_court_type_id: null})
                      update_court.save()
                    }

                }else{
                    const court_query = await Court.query().where('court_type_id',court_type_id).fetch()
                    // DELETE COURT TYPE
                    const sub_court_type_id = court_query.toJSON().map(c=> c.sub_court_type_id)
                    await CourtType.query().whereIn('id',sub_court_type_id).delete()

                    // DELETE COURT
                    await Court.query().where('court_type_id',court_type_id).delete()        
                    court_query.toJSON().map(c => {
                        courts.push(c.id)
                    })
                }
            } catch(err) {
                courts.push(err.toString())
            }
            
                
            var time_slots = []
            try {
                const time_slot = await TimeSlot
                    .query()
                    .where('court_type_id',court_type_id)
                    .delete()
                    // .fetch()
                time_slot.map(ts => {
                    time_slot.push(ts.id)
                })
            } catch (err) {
                time_slots.push(err.toString())
            }

            var slot_prices = []
            try {
                const slot_price = await SlotPrice
                    .query()
                    .whereIn('time_slot_id',time_slots.map(ts => ts = ts.id))
                    .delete()
                    // .fetch()
                slot_price.map(sp => {
                    slot_prices.push(sp.id)
                })
            } catch (err) {
                slot_prices.push(err.toString())
            }

            await court_type.delete()

            var provider_sports = []
            try {
                var check_provider_sport = await ProviderSport.find(court_type.provider_sport_id)
                await check_provider_sport.load('court_types')
                if (check_provider_sport.toJSON().court_types.length < 1) {
                    await check_provider_sport.delete()
                    provider_sports.push(check_provider_sport.id)
                }
            } catch (err) {
                provider_sports.push(err.toString())
            }

            return response.send({ status: 'succes', deleted: {
                court_type,
                courts,
                time_slots,
                slot_prices,
                provider_sports
            }})
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString()})
        }
    }

    async create_slot_price({ response, request, auth }) {
        try {
            const {
                time_slot_id,
                slot_prices
            } = request.body
    
            var created_slotPrices = []
            for (var i=0;i<slot_prices.length;i++) {
                const slot_price = await SlotPrice.create({
                    time_slot_id: time_slot_id,
                    start_time:slot_prices[i].start_time,
                    end_time: slot_prices[i].end_time,
                    var_price: slot_prices[i].var_price
                })
                created_slotPrices.push(slot_price)
            }
    
            return response.send({status: 'success', actions: {
                created_slotPrices
            }})
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async update_slot_price({ response, request, auth}) {
        try {
            const { slot_price, edit_slot_price } = request.body
    
            var created_SlotPrice = []
            var updated_SlotPrice = []
            var deleted_SlotPrice = []

            for (var i=0;i<slot_price.length;i++) {
                const update_slot_price = await SlotPrice.find(slot_price[i].id)
                await update_slot_price.merge(slot_price[i])
                await update_slot_price.save()
                updated_SlotPrice.push(update_slot_price)
            }

            if (edit_slot_price) {
                if (edit_slot_price.delete) {
                    for (var i=0;i<edit_slot_price.delete.length;i++) {
                        const delete_SlotPrice = await SlotPrice.find(edit_slot_price.delete[i])
                        await delete_SlotPrice.delete()
                        deleted_SlotPrice.push(delete_SlotPrice)
                    }
                }

                if (edit_slot_price.create) {
                    for (var i=0;i<edit_slot_price.create.length;i++) {
                        const created_SlotPrices = await SlotPrice.create({
                            time_slot_id: edit_slot_price.create[i].time_slot_id,
                            start_time:edit_slot_price.create[i].start_time,
                            end_time: edit_slot_price.create[i].end_time,
                            var_price: edit_slot_price.create[i].var_price
                        })
                        created_SlotPrice.push({ created: created_SlotPrices})
                    }
                }
            }
    
            return response.send({status: 'success', actions: {
                created_SlotPrice,
                updated_SlotPrice,
                deleted_SlotPrice
            }})
        } catch (err) {
            console.log(err);
            return response.send({ status: 'error', error: err.toString()})
        }
    }

    async delete_slot_price({ response, request, auth }) {
        try {
            const slot_price_ids = request.body.slot_price_ids
            var deleted_slot_prices = []
            for (var i=0;i<slot_price_ids.length;i++) {
                const slot_price = await SlotPrice.find(slot_price_ids[i])
                await slot_price.delete()
                deleted_slot_prices.push(slot_price)
            }
            return response.send({ status: 'success', deleted: {
                deleted_slot_prices
            }})
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async index_sport ({ response, request, auth }) {
        const provider = await auth.getUser()
        const sports = await ProviderSport
            .query()
            .where('provider_id',provider.id)
            .with('sport')
            .with('court_types',(ct) => {
                ct.with('courts')
                ct.with('share_courts')
                ct.with('time_slots.slot_prices')
            })
            .fetch()

        var result = sports.toJSON().map(ps =>{
            ps.court_types.map(ct => {
                ct.courts.map(c => {
                    c.price = ct.price
                    return c
                })
                return ct
            })
            return ps
        })
        return response.send(result)
    }

    async check_court ({ response, request }) {
        const {
            court_id
        } = request.get()
        const time_now = moment().format(timeFormat)
        const matches = await Match
            .query()
            .where('court_id',request.get().court_id)
            .where('cancel', 0)
            .where(function() {
                this.where('time_start','>=',time_now)
                this.orWhere('time_end','>=',time_now)
            })
            .fetch()
        
        const court = await Court.find(request.get().court_id)

        const result = {
            method: { court_id: court_id, time: time_now },
            matches: matches,
            empty: matches.toJSON().length>0? false:true,
            sub_court_type_id: court.sub_court_type_id,
            deletable:  matches.toJSON().length <=0 && court.sub_court_type_id == null
        }
        return response.send(result)
    }

    async check_court_type ({ response, request }) {
        const {
            court_type_id
        } = request.get()
        const time_now = moment().format(timeFormat)
        var court_type = await CourtType
            .query()
            .where('id',court_type_id)
            .with('courts')
            .with('share_courts')
            .fetch()

        var court_ids = court_type.toJSON()[0].share_court ==1?  court_type.toJSON()[0].share_courts.map(c => c = c.id) : court_type.toJSON()[0].courts.map(c => c = c.id)
        const matches = await Match
            .query()
            .whereIn('court_id',court_ids)
            .where('cancel', 0)
            .where(function() {
                this.where('time_start','>=',time_now)
                this.orWhere('time_end','>=',time_now)
            })
            .fetch()

        const result = {
            method: { court_type_id: court_type_id, time: time_now },
            matches: matches,
            empty: matches.length>0? false:true
        }

        return response.send(result)
    }

    async getCourtTypeToNewFullcourt({ response, request }){
        const {provider_sport_id, type} = request.body
        try {
            const court_types = await CourtType
                                .query()
                                .where('provider_sport_id', provider_sport_id)
                                .where('type', type)
                                .where('share_court', 0)
                                .with('courts')
                                .fetch()

            var result = court_types.toJSON().filter((f)=>{
                f.limit = parseInt((f.courts.length / 2), 10)
                f.share_court_length = f.courts.filter(c=> c.sub_court_type_id !=null).length
                return f.limit != (parseInt((f.share_court_length / 2), 10))
            })
                                
            return response.send(result)
        } catch (error) {
            console.log(error)
            return response.send(error)
        }
    }
}

module.exports = ArenaSettingController

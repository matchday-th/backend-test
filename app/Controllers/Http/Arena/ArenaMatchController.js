'use strict'

const Room = use('App/Models/Room')
const Match = use('App/Models/Match')
const Contact = use('App/Models/ContactMatch')
const TpRoom = use('App/Models/TpRoom')
const MatchRoom = use('App/Models/MatchRoom')
const moment = use('moment')
const Bridge = require('../Bridge.js')
const CreateMatch = require('../CreateMatch.js')
const Utility = require('../Utility.js')
const Log = use('App/Models/Log')
const { Validator, Mutator, Checker, Creator, Tools, Email, Version } = require('../Utility.js')
const timeFormat = 'YYYY-MM-DD HH:mm:ss'
const Helper  = require('../Helper.js');

class ArenaMatchController {
    async monthlyMatches({ request, response, auth }) {
        try {
            const sp = await auth.getUser()
            var { time_start, time_end } = request.body
            time_start = Validator.matchTimeInput(time_start, time_end)

            const matches = await Match
                            .query()
                            .where('cancel',0)
                            .whereBetween('time_end',[time_start,time_end])
                            .whereHas('court.court_type.provider_sport.provider',(p)=> {
                                p.where('id',sp.id)
                            })
                            .with('court.court_type.provider_sport',(ps)=> {
                                ps.with('sport')
                                ps.with('provider')
                            })
                            .with('court.sub_court_type.provider_sport',(ps)=> {
                                ps.with('sport')
                                ps.with('provider')
                            })
                            .with('court.court_type.courts')
                            .with('stack',(s)=> {
                                s.with('matches',(m)=> {
                                    m.with('court')
                                    m.where('cancel',0)
                                })
                                s.with('contacts')
                            })
                            .with('services')
                            .with('inventories.item_type')
                            .with('rooms.user')
                            .with('user')
                            .with('contacts')
                            .with('used_bundle.asset_bundle.bundle')
                            .with('promotion')
                            .with('match_discount')
                            .with('payments')
                            .fetch()

        const endpoint = matches.toJSON().map((match) => {
            if(match.is_share_court == 1){
                match.court.sub_court_type.courts = match.court.court_type.courts
                match.court.court_type =  match.court.sub_court_type
            }
            if(match.stack){
                match.stack.matches = Utility.Mutator.filter_share_match(match.stack.matches)
            }
           
            return {
                id: match.id,
                trainer_match_id: match.trainer_match_id,
                name: Mutator.getMatchName(match),
                tel: Mutator.getMatchPhone(match),
                date: moment(match.time_start,timeFormat).format('DD/MM/YYYY'),
                time_start: match.time_start,
                time_end: match.time_end,
                price: Mutator.getMatchNetPrice(match),
                paid_amount: match.paid_amount,
                total_price: Mutator.getMatchPriceSummary(match),
                match_price: match.match_price,
                contacts: (match.stack)? match.stack.contacts:match.contacts,
                service_price :  CreateMatch.Calculate.cal_service_price({services:match.services, inventories:match.inventories}).total_service_price,
                add_price:[ 
                    ...match.services.map(s=>s={
                        id:s.pivot.id,
                        service_id:s.pivot.service_id,
                        name:s.name,
                        price:s.pivot.price,
                        amount:s.pivot.amount,
                        service_type:{type:'service',name:"อุปกรณ์"}}),
                    ...match.inventories.map(s=>s={
                        id:s.pivot.id,
                        service_id:s.pivot.inventory_id,
                        name:s.name,
                        price:s.pivot.price,
                        amount:s.pivot.amount,
                        service_type:{type:'inventory',name:"สินค้า"}})],
                court: match.court.name,
                court_id: match.court.id,
                sport: match.court.court_type.provider_sport.sport.name,
                provider_sport_id: match.court.court_type.provider_sport.id,
                court_type: match.court.court_type,
                share_court: match.is_share_court,
                share_match_id: match.share_match_id,
                payment_method: Mutator.getMatchPayment(match),
                payment_status: Mutator.getMatchStatus(match),
                payment_detail: Mutator.getMatchPaymentDetail(match),
                match_type: (match.user)? 'normal':((match.room_switch)? 'gs':((match.stack)? 'longbook':'normal')),/* group ss, longbook */
                repeated: (match.stack)? Tools.getRepeatedDay(match.stack.matches):null,
                stack: (match.stack)? match.stack.matches.map(ms => ms = { 
                    id:ms.id, 
                    date: moment(ms.time_start,timeFormat).format('DD/MM/YYYY'),
                    payment_status: Mutator.getMatchStatus(ms),
                    court: {
                        id: ms.court? ms.court.id:'',
                        name: ms.court? ms.court.name:'',
                        image: ms.court? ms.court.image:''
                    },
                    match_price: ms.match_price?ms.match_price:0
                }):[],
                stack_id: (match.stack)? match.stack_id:null,
                editable: (match.user)? false:true,
                check_in : match.check_in,
                players: (match.rooms)? match.rooms.map(u => u = { name: (u.user)? u.user.fullname:u.description, tel: (u.user)? u.user.phone_number:'', paid_ticket: u.paid_ticket, id:u.id}):[],
                duration: Helper.getDuration({ time_start: match.time_start, time_end: match.time_end },'minutes'),
                payment_solution: match.payment_status,
                share_match_id: match.share_match_id,
                match_discount: match.match_discount,
                is_owner: match.user? false:true
            }
        })

        const result =  Utility.Mutator.filter_share_match(endpoint, 'share_court')
            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.send({ err })
        }
    }
    
    async createMatch({ request, response, auth }) {
        try {
            const provider = await auth.getUser()
            var match = request.body
            var options = match.settings
            match.provider = provider.toJSON()
            match.settings = {
                room_switch: (options.type == 'gs')? 1:0,
                description: (options.phone_number)? `${options.name} ${options.phone_number}` : `${options.name}`,
                paid_amount: options.paid_amount
            }
            
            const result = await Creator.makeMatch(match,(match.getMail != undefined)? match.getMail:false)

            return response.send(result)
        } catch (err) {
            console.log(err);
        }
    }

    async editMatch({ request, response, auth, params }) {
        var input = request.body
        var change_price
        var room_id
        const match = await Match.find(params.match_id)
        await match.loadMany(['match_discount'])
            try {
                const { cancel } = input
                if (input.name || input.tel) {
                    input.description = `${input.name} ${input.tel}`
                }

                if (input.check_in){
                    const discount = match.toJSON().match_discount
                    if(discount){
                        input.paid_amount = match.total_price - discount.total_discount
                    }else{
                        input.paid_amount = match.total_price
                    }
                }

                if (input.time_start) input.time_start = Helper.matchTimeInput(input.time_start, match.time_end)
                
                if(input.change_price || input.change_price == 0) {
                    change_price = input.change_price
                }

                if(input.service) await Bridge.Package.update_MatchService({match_id: match.id, body: input.service})
                if(input.inventory) await Bridge.Package.update_MatchInventory({match_id: match.id, body: input.inventory})
                await match.loadMany(['inventories','services','used_bundle'])


                if(Utility.Mutator.getMatchStatus(match.toJSON()) != 'unpaid'){
                    input.match_price = match.match_price
                }else{
                    if(!input.check_in){
                        const match_endpoint = match.toJSON()
                        match_endpoint.time_start = input.time_start
                        match_endpoint.time_end = input.time_end
                        match_endpoint.court_id = input.court_id ? input.court_id : match_endpoint.court_id
                        input.match_price = await Utility.Calculation.recheck_match_price(match_endpoint, input.match_price)
                    }
                }

                if(match.court_id != input.court_id && input.court_id && match.trainer_match_id){
                    //trainer
                    const old_room  = await TpRoom.query().where('court_id', match.court_id).first()
                    const room  = await TpRoom.query().where('court_id', input.court_id).first()
                    if (room) {
                        room_id = room.id
                        await MatchRoom.query().where('tp_room_id', old_room.id).where('trainer_match_id', match.trainer_match_id).update({tp_room_id: room_id})
                    }
                }

                if(match.trainer_match_id){
                    if(cancel){
                        //trainer
                        const room  = await TpRoom.query().where('court_id', match.court_id).first()
                        await MatchRoom.query().where('tp_room_id', room.id).where('trainer_match_id', match.trainer_match_id).delete()
                    }
                }
                input.match_price = input.match_price? input.match_price : match.toJSON().match_price
                const  match_body = {
                    description: input.description,
                    time_start: input.time_start,
                    time_end: input.time_end,
                    cancel: input.cancel,
                    paid_amount: input.paid_amount,
                    check_in: input.check_in,
                    match_price: input.match_price,
                    change_price: change_price,
                    court_id: input.court_id,
                    payment_status: input.payment_status,
                    room_id: room_id
                }
                await match.merge(match_body)
                await Log.create({ match_id: match.id, version: Version.api_version, method:'editMatch', request_body: JSON.stringify(match_body) })
                await match.save()

                if (match.share_match_id) {
                    const match2 = await Match.find(parseFloat(params.match_id)+1)
                    if (cancel) {
                        await match2.merge({ cancel })
                        await match2.save()
                    }
                }

                await CreateMatch.AutoUpdate.update_match_price(params.match_id)
                
                await match.loadMany(['user','provider'])
                const { user, provider } = match.toJSON()
                const { time_start, time_end, court_id } = input
                if (user && time_start && time_end && court_id) {
                    Email.emailSender({
                        type: 'UpdateMatch',
                        courts: [match.court_id],
                        user: (user)? { 
                            fullname: user.fullname,
                            phone_number: user.phone_number,
                            email: user.email,
                            lang: user.lang }:null,
                        provider: (provider)? { 
                            fullname: provider.fullname,
                            phone_number: provider.phone_number,
                            email: provider.email,
                            lang: provider.lang }:null,
                        match: [match.toJSON()],
                    })
                }
                
                return response.send({status: 'success',match: match.toJSON() })
            } catch (err) {
                console.log(err);
                return response.send({status : 'fail', error:err})
            }
    }

    async alert_before_edit({ response, auth, params }) {
        try {
            const match = await Match.find(params.id)
            await match.loadMany(['user','provider'])

            const{ user, provider } = match.toJSON()
            Email.emailSender({
                type: 'UrgentUpdate',
                courts: [match.court_id],
                user: (user)? { 
                    fullname: user.fullname,
                    phone_number: user.phone_number,
                    email: user.email,
                    lang: user.lang }:null,
                provider: (provider)? { 
                    fullname: provider.fullname,
                    phone_number: provider.phone_number,
                    email: provider.email,
                    lang: provider.lang }:null,
                match: [match.toJSON()],
            })
            Utility.Notification.notificationToApp({matches: [match.toJSON()], type: 'UrgentUpdate'}, user)

            return response.send({status: 'success',match: match.toJSON() })
        } catch (err) {
            console.log(err);
            return response.send({status : 'fail', error:err})
        }
    }

    async addPlayer ({ response, request, params }) {
        const { user, price} = request.body
        if (user) {
            try {
                let room = new Room()
                room.match_id = params.match_id
                room.paid_ticket = price
                room.accept = 1
                room.description = user
                await room.save()

                await CreateMatch.AutoUpdate.update_match_price(params.match_id)

                return response.send({ status: 'success', created: room.id })
            } catch (err) {
                console.log(err);
                return response.send({ status: 'fail', error: err.toString() })
            }
        } else {
            return response.send({ status: 'fail', error: 'name cant be blank' })
        }
    }

    async kickPlayer ({ response, params }) {
        try {
            const room = await Room.find(params.room_id)
            await room.delete()

            await CreateMatch.AutoUpdate.update_match_price(room.match_id)

            return response.send({ status: 'success', deleted: room.id })
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString() })
        }
    }

    async addContact ({ response, request, params }) {
        try {
            const input = request.body
            const contact = await Contact.create(input)
            await contact.save()

            return response.send({status: 'success', created: contact})
        } catch (err) {
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async delContact ({ response, params }) {
        try {
            const contact = await Contact.find(params.id)
            await contact.delete()

            return response.send({status: 'success', deleted: contact})
        } catch (err) {
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async editContact ({ response, request, params }) {
        try {
            const input = request.body
            const contact = await Contact.find(params.id)
            await contact.merge(input)
            await contact.save()

            return response.send({status: 'success', edited: contact})
        } catch (err) {
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async getSlip ({ request, response, auth }) {
        try {
            var match = request.body
            const result = await CreateMatch.Slip.match_slip(match)
            return response.send(result)
        } catch (err) {
            console.log(err);
        }
    }
    
}

module.exports = ArenaMatchController

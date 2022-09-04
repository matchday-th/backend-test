'use strict'

const Match = use('App/Models/Match')
const Court = use('App/Models/Court')
const Stack = use('App/Models/Stack')

const moment = use('moment')
const Database = use('Database')
const Room = use('App/Models/Room')
const Log = use('App/Models/Log')
const Mail = use('Mail')

const { Creator, Checker, Validator, Email, Version, Mutator, Notification} = require('./Utility')

class MatchController {

    async index ({response}){
        let now = moment().subtract(15,'minutes').toDate()

        const matches = await Match
            .query()
            .where('room_switch',1)
            .where('cancel',0)
            .whereHas('court.court_type.provider_sport.provider',(sp)=> {
                sp.where('public',0)
            })
            .with('court.court_type.provider_sport',(bd)=>{
                bd.with('sport')
                bd.with('provider')
            })
            .with('user')
            .with('preference.roles')
            .with('rooms',(sp)=>{
                sp.where('accept',1)
                sp.with('user')
            })
            .where('time_start','>=',now)
            .fetch()

        return response.send(matches)
    }

    async store ({response, request, auth, params}){
        const uid = await auth.getUser()
        const {
            room_switch,
            preference_id,
            total_price,
            services,
            payment,
            time_start,
            time_end,
            description } 
            = request.body

        let match = new Match()
        match.user_id = uid.id
        match.room_switch = room_switch
        match.preference_id = preference_id
        match.total_price = total_price
        match.court_id = params.id
        match.time_start = time_start
        match.time_end = time_end
        match.description = description
        match.payment = payment

        let courts = []
        const court = await Court.find(params.id)
        const checkCourtStart = await court
            .matches()
            .where('cancel',0)
            .whereBetween('time_start',[time_start,time_end])
            .with('court.court_type.provider_sport.provider')
            .with('user')
            .fetch()
        courts.push(checkCourtStart.toJSON()[0])
        
        const checkCourtEnd = await court
            .matches()
            .where('cancel',0)
            .whereBetween('time_end',[time_start,time_end])
            .with('court.court_type.provider_sport.provider')
            .with('user')
            .fetch()
        courts.push(checkCourtEnd.toJSON()[0])

        let res = []
        try {
        courts = courts.filter((thing, index, self) =>
            index === self.findIndex((t) => (
            t.id === thing.id
            ))
        )} catch (err) {}

        var i;
        for (i=0;i<courts.length;i++){
            if(courts[i] !== undefined) {
                res.push(courts[i])
            }
        }

        if (res.length < 1 ){
            try {
                const court_data = await Court
                                    .query()
                                    .where('id',params.id)
                                    .with('court_type.provider_sport.provider')
                                    .fetch()

                const court_info = court_data.toJSON()[0]
                await match.save()

                await Creator.matchServices(match.id,services)

                try {
                    if (description | description.length > 0) {
                        if (description.split(',')[0] == 'p') {
                            uid.fullname = description.split(',')[1]
                            uid.phone_number = description.split(',')[description.split(',').length-1]
                        }
                    }
                } catch (err) {

                }

                if (!payment) {
                    Email.emailSender({
                        type: 'CreateMatch',
                        courts: [params.id],
                        user: (uid)? { 
                            fullname: user.fullname,
                            phone_number: user.phone_number,
                            email: user.email,
                            lang: user.lang }:null, 
                        provider: (court_info.court_type.provider_sport.provider)? {
                            fullname: court_info.court_type.provider_sport.provider.fullname,
                            phone_number: court_info.court_type.provider_sport.provider.phone_number,
                            email: court_info.court_type.provider_sport.provider.email,
                            lang: court_info.court_type.provider_sport.provider.lang }:null,
                        match: [match]
                    })
                }
                
                return response.send({status:'Success - Match Created',
                                        match_id:match.id})
            } catch (err) {
                return response.send({status:'error',
                                        error: err.toString(),
                                        match_id:match.id})
            }
        } else {
            return response.send({status:'Fail',error:'Court Booked',
                                    Match:res})
        }
    }

    async show ({response, request, params, auth}){
        const user = await auth.getUser()
        const match = await Match
                .query()
                .where('id',params.id)
                .with('court.court_type.provider_sport',(bd)=>{
                    bd.with('sport')
                    bd.with('provider',(de)=> {
                        de.with('photos')
                        de.with('ratings')
                    })
                })
                .with('stack.matches.court')
                .with('user')
                .with('preference.roles')
                .with('rooms',(sp)=>{
                    sp.where('accept',1)
                    sp.with('user')
                })
                .with('used_bundle')
                .fetch()
        let result = match.toJSON()[0]

        if (result.user_id == user.id) {
            result.user_status = 'owner'
        } else {
            result.user_status = 'not-owner'
        }

        result.payment_method = Mutator.getMatchPayment(result)
        result.payment_status = Mutator.getMatchStatus(result)

        return response.send(result)
    }

    async update ({response, request, params, auth}){
        var match = await Match.find(params.id)
        const user = await auth.getUser()
        try {
            if( request.body.cancel ) {
                await match.merge(request.body)
                await match.save()
                await match.load('court.court_type.provider_sport.provider')
                match = match.toJSON()
                var provider = match.court.court_type.provider_sport.provider

                await Notification.notificationSender({matches: [match], user, type: 'CancelMatch'},provider.id)
                const email_result = Email.emailSender({
                    type: 'CancelMatch',
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
                    match: [match],
                })
                
                await Log.create({ match_id: match.id, version: Version.api_version, method: 'cancel', request_body: JSON.stringify({user_id: user.id}) })
                return response.send({status: 'Success', 'canceled':match.id})
            } else {
                await match.merge(request.body)
                await match.save()

                await match.load('court.court_type.provider_sport.provider')
                match = match.toJSON()
                var provider = match.court.court_type.provider_sport.provider

                await Notification.notificationSender({matches: [match], user, type: 'UpdateMatch'},provider.id)
                await Log.create({ match_id: match.id, version: Version.api_version, method: 'update', request_body: JSON.stringify(request.body,{user_id:user.id}) })
                return response.send({"updated":match})
            }
        } catch (err) {
            console.log(err);
            return response.send({status : 'Fail', error:err})
        }
    }

    async destroy ({params, auth,response}){
        const match = await Match.find(params.id)
        const uid = await auth.getUser()
        if (match.user_id == uid.id) {
            match.delete()
            return response.send('== Match Deleted ==')
        } else {
            return response.send('== Not Authorized ==')
        }
    }

    
    //Room
    async join ({auth, params, response}) {
        const user = await auth.getUser()
        var match = await Match.find(params.id)
        await match.loadMany(['rooms','preference','court.court_type.provider_sport.provider','user'])
        match = match.toJSON()

        const room_array = await Database
            .select('*')
            .from('rooms')
            .where('match_id',match.id)

        const size = match.court.court_type.max_team_size
        let joined = room_array.filter(player =>{
            if (player.accept == 1) {
                return player
            }
        })

        if ((joined.length < size) && (user.id !== match.user_id) ) {

            let newroom = new Room()
            newroom.match_id = match.id
            newroom.user_id = user.id
            newroom.accept = 1
            await newroom.save()

            var owner = match.user
            var court = match.court
            var provider = match.court.court_type.provider_sport.provider

            Email.emailSender({
                type: 'JoinMatch',
                courts: [court.id],
                user: (user)? { 
                    fullname: user.fullname,
                    phone_number: user.phone_number,
                    email: user.email,
                    lang: user.lang }:null, 
                owner: (owner)? {
                    fullname: owner.fullname,
                    phone_number: owner.phone_number,
                    email: owner.email,
                    lang: owner.lang }:null,
                provider: (provider)? {
                    fullname: provider.fullname,
                    phone_number: provider.phone_number,
                    email: provider.email,
                    lang: provider.lang }:null,
                match: [match]
            })

            return response.send({"joined MatchID":match.id,
                                    "Room":newroom})

        } else if (user.id == match.user_id) {
            return response.send(`== You're hosting this room ==`)

        } else {
            return response.send({status:'Fail',msg:'Team Full',match:match.toJSON()})
        }
    }

    async inv ({params, response, request}) {
        const { users } = request.body
        const match = await Match.find(params.id)

        const room_array = await Database
            .select('*')
            .from('rooms')
            .where('match_id',match.id)

        let joined = room_array.filter(player =>{
            if (player.accept == 1) {
                return player
            }
        })

        const size = match.team_size
    
        let invUsers = []
        var i;
        for (i = 0; i <= room_array.length; i++) {
            try {
            if (joined.length < size && users[i].user_id !== match.user_id ) {

                let newroom = await match
                                .rooms()
                                .create(users[i])
                
                invUsers.push(newroom.toJSON())
    
            } else {
                return response.send({status:'Fail',msg:'Team Full',match:match.toJSON()})
            }
            } catch (err) {
                
            }
        }

        return response.send({"Invitation Sent": invUsers,
        match:match.toJSON()})
    }

    async leave ({request, params, response, auth}) {
        const match = await Match.find(params.id)
        const user_id = await auth.getUser()
        const room_array = await Database
            .from('rooms')
            .where({"match_id":match.id,"user_id":user_id.id})
            .del()

        return response.send(`Quited from MatchID ${match.id}`)
    }

    async kick ({response,request,auth,params}) {
        const match = await Match.find(params.id)
        const user = await auth.getUser()

        if (user.id == match.user_id) {

            const { user_id } = request.body
            await Database
                .from('rooms')
                .where({"match_id":match.id,"user_id":user_id})
                .del()
            
            return response.send(`Removed ${user_id} from your team`)
        } else {
            return response.send(`Unauthorized, You're not Match owner`)
        }
    }


    //Longbook
    async getStackUser ({ response, params }) {
        try {
        const stack = await Stack.find(params.id)
        await stack.load('matches.court.court_type.provider_sport.provider')

        return response.send(stack)
        } catch (err) {
            return response.send({status: 'fail',error:err})
        }
    }
    async getStackSp ({ response, params }) {
        try {
            const stack = await Stack.find(params.id)
            await stack.load('matches')
    
            return response.send(stack)
            } catch (err) {
                return response.send({status: 'fail',error:err})
            }
    }

    async createStackUser ({response, request, auth, params}) {
        const user = await auth.getUser()
        var n = parseInt(params.weeks,10)+1
        const courts = params.id.split(',').map(n => parseInt(n,10))
        const {
            room_switch,
            preference_id,
            total_price,
            service_id,
            time_start,
            time_end,
            description } = request.body

        let stack = new Stack()
        stack.user_id = user.id
        await stack.save()

        let matches = []
        for (var c=0;c<courts.length;c++) {
            for (var i=0;i<n;i++) {
                let date = addWeeks(time_start,time_end,i)
                
                let match = new Match()
                match.user_id = user.id
                match.room_switch = room_switch
                match.preference_id = preference_id
                match.service_id = service_id
                match.total_price = total_price
                match.court_id = courts[c]
                match.time_start = date.time_start
                match.time_end = date.time_end
                match.description = description
                match.stack_id = stack.id
                
                if (await Checker.checkCourt(courts[c], date.time_start, date.time_end)) {
                    try {
                        await match.save()
                        matches.push({status: 'success', match: match.id})
                    } catch (err) {
                        matches.push({status: 'fail',
                        match: match.id,
                        error: err.toString()})
                        break
                    }
                } else {
                    matches.push({status: 'fail',
                    match: match.id,
                    error: 'booked'})
                    break
                }
            }
        }
        
        const court_data = await Court
                                    .query()
                                    .whereIn('id',courts)
                                    .with('court_type.provider_sport.provider')
                                    .fetch()

        const court_info = court_data.toJSON()
        const court_name = court_info.map(court => court.name).toString()

        try {
        let sp_mail = await Mail.raw(
            `<h1>การจองต่อเนื่อง ID:${stack.id}</h1>
            <h1>${court_info[0].court_type.provider_sport.provider.fullname} - ${court_name}</h1>
            <h2>${user.toJSON().fullname} - <a href="tel:${user.toJSON().phone_number}">${user.toJSON().phone_number}</a></h2>
            <h3>Match Start: ${time_start}</h3>
            <h3>Match End: ${time_end}</h3>
            <h3>Match Created: ${matches.length}</h3>
            <h3>จองติดต่อกัน: ${n} สัปดาห์</h3>
            `, (message) => {
                // message.from('matchday.th@gmail.com')
                message.from('booking.matchday@gmail.com')
                message.to(`${court_info[0].court_type.provider_sport.provider.email}`)
                message.subject(`คุณได้รับการจองใหม่! Stack ID:${stack.id}`)
            })

        let our_mail = await Mail.raw(
            `<h1>จองต่อเนื่อง ID:${stack.id}</h1>
            <h1>${court_info[0].court_type.provider_sport.provider.fullname} - ${court_name}</h1>
            <h2>${user.toJSON().fullname} - <a href="tel:${user.toJSON().phone_number}">${user.toJSON().phone_number}</a></h2>
            <h3>Match Start: ${time_start}</h3>
            <h3>Match End: ${time_end}</h3>
            <h3>Match Created: ${matches.length}</h3>
            <h3>จองติดต่อกัน: ${n} สัปดาห์</h3>
            `, (message) => {
                // message.from('matchday.th@gmail.com')
                message.from('booking.matchday@gmail.com')
                message.to('booking.matchday@gmail.com')
                message.subject(`คุณได้รับการจองใหม่! Stack ID:${stack.id}`)
            })
        } catch (err) {
            console.log(err);
        }

        const result = {
            status: 'done',
            stack_id : stack.id,
            matches: matches,
            attempted: n,
            created: matches.length
        }

        return response.send(result)
    }
    async createStackSp ({response, request, auth, params}) {
        const sp = await auth.getUser()
        var n = parseInt(params.weeks,10)+1
        const courts = params.id.split(',').map(n => parseInt(n,10))
        const {
            room_switch,
            preference_id,
            total_price,
            service_id,
            time_start,
            time_end,
            description } = request.body

        let stack = new Stack()
        stack.provider_id = sp.id
        await stack.save()

        let matches = []
        for (var c=0;c<courts.length;c++) {
            for (var i=0;i<n;i++) {
                let date = addWeeks(time_start,time_end,i)
                
                let match = new Match()
                match.room_switch = room_switch
                match.preference_id = preference_id
                match.service_id = service_id
                match.total_price = total_price
                match.court_id = courts[c]
                match.time_start = date.time_start
                match.time_end = date.time_end
                match.description = description
                match.stack_id = stack.id

                if (await Checker.checkCourt(courts[c], Validator.matchTimeInput(date.time_start, date.time_end), date.time_end)) {
                    try {
                        await match.save()
                        matches.push({status: 'success', match: match.id})
                    } catch (err) {
                        matches.push({status: 'fail',
                        match: match.id,
                        error: err.toString()})
                        break
                    }
                } else {
                    matches.push({status: 'fail',
                    match: match.id,
                    error: 'booked'})
                    break
                }
            }
        }

        const result = {
            status: 'done',
            stack_id : stack.id,
            matches: matches,
            attempted: n,
            created: matches.length
        }

        return response.send(result)
    }

    async deleteStackSp_all ({ response, params, auth }) {
        const sp = await auth.getUser()
        const stack = await Stack.find(params.id)
        await stack.load('matches')

        if (stack.provider_id == sp.id || stack.trainer_provider_id) {
            try {
                await Match
                    .query()
                    .where('stack_id',stack.id)
                    .where('paid_amount',0)
                    .where('check_in',0)
                    .update({cancel : 1})

                await stack.merge({cancel: true})
                await stack.save()

                return response.send({status: 'success',msg: 'all match deleted',stack_id: stack.id})
            } catch (err) {
                return response.send({status: 'fail',error: err.toString()})
            }
        } else {
            return response.send({status: 'fail', msg: 'Unauthorized'})
        }
    }
    async deleteStackUser_all ({ response, params, auth }) {
        const user = await auth.getUser()
        const stack = await Stack.find(params.id)
        await stack.load('matches')

        if (stack.user_id == user.id) {
            try {
                await Match
                    .query()
                    .where('stack_id',stack.id)
                    .update({cancel : 1})

                await stack.merge({cancel: true})
                await stack.save()

                return response.send({status: 'success',msg: 'all match deleted',stack_id: stack.id})
            } catch (err) {
                return response.send({status: 'fail',error: err.toString()})
            }
        } else {
            return response.send({status: 'fail', msg: 'Unauthorized'})
        }
    }
    async deleteStack_each ({ response, params }) {
        const match = await Match.find(params.id)
        try {
            await match.merge({cancel: true})
            await match.save()

            return response.send({status: 'success',msg: 'match canceled',match_id: match.id})
        } catch (err) {
            return response.send({status: 'fail',error: err.toString()})
        }
    }
}

module.exports = MatchController


//======== * functions * =========
function addWeeks (timeStart,timeEnd,week) {
    const start = moment(timeStart,'YYYY-MM-DD HH:mm')
                .add(7*week,'days')
                .format('YYYY-MM-DD HH:mm')
                
    const end = moment(timeEnd,'YYYY-MM-DD HH:mm')
                .add(7*week,'days')
                .format('YYYY-MM-DD HH:mm')
    
    return { time_start : start, time_end : end}
}
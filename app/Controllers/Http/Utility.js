const moment = use('moment')
const timeFormat = 'YYYY-MM-DD HH:mm:ss'
const Database = use('Database')

const Env = use('Env')
const Twilio = require('twilio')(Env.get('TWILIO_SID'), Env.get('TWILIO_TOKEN'));
const OneSignal_APP_ID = (Env.get('OneSignal_APP_ID'));

const OneSignal_Arena_APP_ID = (Env.get('OneSignal_Arena_APP_ID'));

/* Define Models */
const Court = use('App/Models/Court')
const Token = use('App/Models/Token')
const CourtType = use('App/Models/CourtType')
const Log = use('App/Models/Log')
const Match = use('App/Models/Match')
const Stack = use('App/Models/Stack')
const Provider = use('App/Models/Provider')
const ContactMatch = use('App/Models/ContactMatch')
const MatchService = use('App/Models/MatchService')
const User = use('App/Models/User')
const Asset = use('App/Models/Asset')
const AssetBundle = use('App/Models/AssetBundle')
const Bundle = use('App/Models/Bundle')
const Payment = use('App/Models/Payment')
const OTP_Token = use('App/Models/Otp')
const UsedBundle = use('App/Models/UsedBundle')
const UsedInventory = use('App/Models/UsedInventory')
const PosSubscription = use('App/Models/PosSubscription')
const UserUUID = use('App/Models/UserUuid')

const Helper = require('./Helper.js');
const Loging = require('./Loging.js');
const CreateMatch = require('./CreateMatch.js');
const { joinPeriodPrice, isInRange, addPeriodPrice } = require('./Helper.js')
const Mail = use('Mail')
const FieldsLocale = require('./FieldsLocale');
const Inventory = use('App/Models/Inventory')

const Utility = { /* Cannot use ES6 module Import/Export */
    Version: {
        api_version: 'v4.33.16'
    },
    Checker: {
        async check_unpaid_match(match_ids) {
            const time_out = 300000
            setTimeout(async ()=> {
                try {
                    var unpaid = await Match
                        .query()
                        .whereIn('id',match_ids)
                        .where('payment','{"type":"online","payment_multi":true}')
                        .whereDoesntHave('payments')
                        .fetch()

                    if (unpaid.toJSON().length > 0) {
                        unpaid = unpaid.toJSON().map(match => match = match.id)
                        await Match
                            .query()
                            .whereIn('id',unpaid)
                            .delete()

                        console.log({ deleted: `MatchID: ${unpaid}`, reason: `Payment Timeout`, unpaid: unpaid });
                    }
                } catch (err) {
                    console.log(err);
                }
            }, time_out)
        },
        check_expiration(bundle) {
            if (bundle.expire_start && bundle.expire_end) {
                const { expire_start, expire_end } = bundle
                const now = moment().unix()
                const start = moment(expire_start,timeFormat).unix()
                const end = moment(expire_end,timeFormat).unix()

                return ((now >= start) && (now <= end))? false:true
            } else {
                return false
            }
        },
        async checkCourt (court_id, time_start, time_end) {
            const checkCourt = await Court
                .query()
                .where('id',court_id)
                .whereDoesntHave('matches', (match) => {
                    match.where('cancel', 0)
                    match.where(function() {
                        this.whereBetween('time_start', [time_start, time_end])
                        this.orWhereBetween('time_end', [time_start, time_end])
                        this.orWhere(function () {
                            this.where('time_start', '<=', time_start)
                            this.where('time_start', '<=', time_end)
                            this.where('time_end', '>=', time_start)
                            this.where('time_end', '>=', time_end)
                        })
                    })
                })
                .fetch()
            
            /* Query Result */
            return checkCourt.toJSON().length != 0
        },
        async checkCourtType ({ court_type_ids, time_start, time_end ,period_price }) {
            try {
                time_start = Utility.Validator.matchTimeInput(time_start, time_end)
                time_end = Utility.Validator.checkDay_timeEnd(time_start, time_end)
        
                var court_types = await CourtType
                                .query()
                                .whereIn('id',court_type_ids)
                                .whereHas('courts', (courts)=> {
                                    courts.whereDoesntHave('matches', (match) => {
                                        match.where('cancel', 0)
                                        match.where(function() {
                                            this.whereBetween('time_start', [time_start, time_end])
                                            this.orWhereBetween('time_end', [time_start, time_end])
                                            this.orWhere(function () {
                                                this.where('time_start', '<=', time_start)
                                                this.where('time_start', '<=', time_end)
                                                this.where('time_end', '>=', time_start)
                                                this.where('time_end', '>=', time_end)
                                            })
                                        })
                                    })
                                })
                                .with('courts')
                                .select(['id','name'])
                                .fetch()

                if (period_price) {
                    return await joinPeriodPrice(court_types, time_start, time_end)
                } else {
                    return court_types
                }
            } catch (err) {
                console.log(err);
                return err
            }
        },
        async checkCourtPrice (court_id, time_start, time_end) {
            const price = await addPeriodPrice(court_id, time_start, time_end)

            return price
        },
        check_business_time(provider,{ time_start, time_end}) {
            const today = moment(time_start, timeFormat).format('e')
            var available = []
            var time_slots = []
            provider.court_types.forEach(court_type => {
                court_type.time_slots.forEach(time_slot => {
                    time_slots.push(time_slot)
                })
            })
            provider.provider_sports.forEach(provider_sport => {
                const target = provider_sport.bus_times? provider_sport.bus_times:[]
                target.forEach(bus_time => {
                    time_slots.push(bus_time)
                })
            })

            time_slots.filter(time_slot => time_slot.days.includes(today)).forEach(time_slot => {
                var open_time = moment(`${moment(time_start,timeFormat).format('YYYY-MM-DD')} ${Utility.Mutator.time_corrector(time_slot.open_time)}`,timeFormat).format(timeFormat)
                var close_time = moment(`${moment(time_start,timeFormat).format('YYYY-MM-DD')} ${Utility.Mutator.time_corrector(time_slot.close_time)}`,timeFormat).format(timeFormat)
                close_time = Utility.Validator.checkDay_timeEnd(open_time, close_time)
                open_time = moment(open_time,timeFormat).unix()
                close_time = moment(close_time,timeFormat).unix()
                const compare_time_start = moment(time_start,timeFormat).unix()
                const compare_time_end = moment(time_end,timeFormat).unix()

                if ((open_time <= compare_time_start) && (compare_time_end <= close_time)) {
                    available.push(time_slot.court_type_id? time_slot.court_type_id:time_slot.provider_sport_id)
                }
            })
            return available
        },
        dow_time_range(time_period, dow,{ time_start, time_end }) {
            if (time_period && dow) {
                const check_day = moment(time_start,timeFormat).format('e')
                if (dow.split(',').includes(check_day)) {
                    const period_start = time_period.split('-')[0]
                    var period_end = time_period.split('-')[time_period.split('-').length-1]
                    period_end = Utility.Mutator.time_corrector(period_end)
                    const check_time_start = moment(`${moment(time_start,timeFormat).format('YYYY-MM-DD')} ${period_start}`,timeFormat).format(timeFormat)
                    var check_time_end = moment(`${moment(time_start,timeFormat).format('YYYY-MM-DD')} ${period_end}`,timeFormat).format(timeFormat)
                    check_time_end = Utility.Validator.checkDay_timeEnd(check_time_start,check_time_end)
                    
                    return Helper.isInRange({time_start, time_end},[check_time_start,check_time_end])
                } else {
                    return false
                }
            } else {
                return true
            }
        }
    },
    Calculation: {
        excluded(target, array) {
            return target - (array.reduce((a,b) => parseFloat(a)+parseFloat(b),0))
        },
        sum_in_array(array, digits) {
            if (typeof array == 'number') {
                return array
            } else {
                return parseFloat(array.filter(i => i != null).reduce((a,b) => parseFloat(a)+parseFloat(b),0).toFixed(digits))
            }
        },
        match_total_price(match){
            const { total_price, services, inventories, used_bundle, promotion } = match
            const sum_services = services.map(s => s.pivot.price*s.pivot.amount).reduce((a,b)=>a+b,0)
            const sum_inventories = inventories.map(s => s.pivot.price*s.pivot.amount).reduce((a,b)=>a+b,0)
            const sum_used_bundles = parseFloat(used_bundle? used_bundle.asset_bundle.bundle.price:0)
            const sum_promotions = promotion? promotion.value:0

            return parseFloat(((sum_used_bundles || sum_promotions)? 0:total_price) + sum_services + sum_inventories)
        },
        async recheck_match_total_price(match,input_price) {
            try {
                const { court_id, time_start, time_end, services, inventories, used_bundle, promotion ,fixed_price,change_price} = match
                const sum_services = services.map(s => s.pivot.price*s.pivot.amount).reduce((a,b)=>a+b,0)
                const sum_inventories = inventories.map(s => s.pivot.price*s.pivot.amount).reduce((a,b)=>a+b,0)
                const sum_used_bundles = parseFloat(used_bundle? used_bundle.asset_bundle.bundle.price:0)
                const sum_court_price =  await addPeriodPrice(court_id, time_start, time_end, match.is_share_court)
                const sum_promotions = promotion? promotion.value:0

                var new_price =  input_price || input_price == 0? input_price : change_price ? change_price : fixed_price ? CreateMatch.Calculate.cal_fixed_price(fixed_price,time_start,time_end): sum_court_price
               
                return parseFloat(((sum_used_bundles || sum_promotions)? 0:new_price) + sum_services + sum_inventories)
            } catch (err) {
                console.log(err);
            }
        },
        async recheck_match_price(match,input_price) {
            try {
                const { court_id, time_start, time_end, used_bundle, promotion ,fixed_price,change_price} = match
                const sum_used_bundles = parseFloat(used_bundle? used_bundle.asset_bundle.bundle.price:0)
                const sum_court_price =  await addPeriodPrice(court_id, time_start, time_end, match.is_share_court)
                const sum_promotions = promotion? promotion.value:0

                var new_price = input_price || input_price == 0? input_price :
                                    change_price ? change_price :  
                                        fixed_price ? CreateMatch.Calculate.cal_fixed_price(fixed_price,time_start,time_end): 
                                            sum_court_price
                return parseFloat(((sum_used_bundles || sum_promotions)? 0:new_price))
            } catch (err) {
                console.log({recheck_match_price:err});
            }
        },
        sum_match_services(services, pay_type) {
            try {
                return services.filter(s => s.pivot.pay_method == pay_type).map(s => (s.pivot.price*s.pivot.amount)).reduce((a,b) => a+b,0)
            } catch (err) {
                console.log(err);
                return []
            }
        },
        sum_match_inventories(inventories,) {
            try {
                return inventories.map(s => (s.pivot.price*s.pivot.amount)).reduce((a,b) => a+b,0)
            } catch (err) {
                console.log(err);
                return []
            }
        }
    },
    Creator: {
        async createMatch ({share_court, court_type_id ,court_id, time_start, time_end, user_id, settings, stack_id, services, inventories, fixed_price, payment, method, first_match, free_hour}, provider_id) {
            var actions = []
            const match_price = (fixed_price || fixed_price == 0)? CreateMatch.Calculate.cal_fixed_price(fixed_price,time_start,time_end):await addPeriodPrice(court_id, time_start, time_end, share_court, court_type_id)
            /* Bind Class Attributes */
            let match = new Match()
            match.user_id = user_id
            match.total_price =  settings? (settings.room_switch == 1 ? 0 : match_price):match_price
            match.match_price = match_price
            match.fixed_price = fixed_price
            match.court_id = court_id
            match.time_start = time_start
            match.time_end = time_end
            match.stack_id = stack_id
            match.payment = JSON.stringify(payment)
            match.provider_id = provider_id? provider_id:null
            if(free_hour) match.change_price = match_price
            /* Check for Settings */
            if (settings) {
                match.room_switch = settings.room_switch
                match.preference_id = settings.preference_id
                match.description = settings.description
                match.paid_amount = settings.paid_amount
                if(first_match) match.promotion_id = settings.promotion_id
            }

           await match.save()

            /* Add Services Price */
                if (services && first_match) {
                    await Utility.Creator.matchServices({ match_id: match.id, services: services })
                        var new_total_price = match.total_price + Utility.Mutator.sumServices(services)
                        await match.merge({ total_price: new_total_price })
                        await match.save()
                }
                
                if (inventories && first_match) {
                    await Utility.Creator.useInventory({ match_id: match.id, inventories: inventories })
                        var new_total_price = match.total_price + Utility.Mutator.sumServices(inventories)
                        await match.merge({ total_price: new_total_price })
                        await match.save()
                
                }
    
                if(settings) if (settings.asset_bundle_id && first_match) {
                    const use_bundle = await UsedBundle.create({ asset_bundle_id: settings.asset_bundle_id, provider_id: provider_id, match_id: match.id})
                        const new_price = await Match.find(match.id)
                        await new_price.merge({ total_price: match.total_price })
                        await new_price.save()
                        actions.push(use_bundle)
                }

            var request_body = { court_id, time_start, time_end, user_id, settings, stack_id, services, inventories, fixed_price, payment, provider_id, actions, share_court }
            await Log.create({ match_id: match.id, version: Utility.Version.api_version, method:method, request_body: JSON.stringify(request_body) })
            
            return match
        },
        async createStack ({ user_id, provider_id }) {
            try {
                let stack = new Stack()
                stack.user_id = user_id
                stack.provider_id = provider_id
                await stack.save()

                return stack
            } catch (err) {
                
            }
        },
        async makeMatch ({ time_start, time_end, courts, court_type_id, longbook, settings, services, inventories, user, provider, fixed_price, contacts, payment, payment_multi }, send_mail, method) {
            /* Validate time_start Input */
            time_start = Utility.Validator.matchTimeInput(time_start, time_end)
            time_end = Utility.Validator.checkDay_timeEnd(time_start, time_end)

            /* total match create */
            var matches = []
            var errors = []
            /* round of attemps */ 
            var attemps = []
            const round = (longbook)? parseInt(longbook.days,10)+1:1

            courts = Utility.Validator.check_court_input(courts)

            /* Only Create Stack when booking longbook */
            var stack;
            var free_hour;
            if (round > 1 || courts.length > 1) {
                stack = await Utility.Creator.createStack({
                    user_id : (user)? user.id:null,
                    provider_id: (provider)? provider.id:null
                })
                if (contacts) {
                    if (contacts.length > 0) {
                        for (var i=0;i<contacts.length;i++) {
                            var contact = await Utility.Creator.matchContact({
                                stack_id: stack.id,
                                name: contacts[i].name,
                                phone_number: contacts[i].phone_number
                            })
                        }
                    }
                }
            }

            if(courts.length>0){
                const court = await Court.find(courts[0])
                await court.load('court_type')
                free_hour = court.toJSON().court_type.free_hour
            }

            var share_court_env;
            if (court_type_id) {
                const { is_share_court, valid_courts, is_free_hour} = await Utility.Mutator.share_court_correction(court_type_id, courts)
                share_court_env = is_share_court
                courts = valid_courts
                free_hour = is_free_hour
            }
            
            /* Save Match to Database */
            for (var i=0;i<round;i++) {
                for (var j=0;j<courts.length;j++) {
                    try {
                        /* Mutate time in loop */
                        var loop_time_start = Utility.Mutator.repeatBookDate(time_start, (longbook)? longbook.type:'day', i)
                        var loop_time_end = Utility.Mutator.repeatBookDate(time_end, (longbook)? longbook.type:'day', i)
                            /* Check Available */
                        if (await Utility.Checker.checkCourt(courts[j], loop_time_start, loop_time_end)) {
                            attemps.push(1)
                            var match;
                            try {
                                match = await Utility.Creator.createMatch({
                                    court_id: courts[j],
                                    share_court: share_court_env,
                                    court_type_id: court_type_id,
                                    time_start: loop_time_start,
                                    time_end: loop_time_end,
                                    user_id: (user)? user.id:undefined,
                                    settings: settings,
                                    stack_id: (stack)? stack.id:undefined,
                                    services: (services)? ((services.length>0)? services:undefined):undefined,
                                    inventories: (inventories)? ((inventories.length>0)? inventories:undefined):undefined,
                                    fixed_price: fixed_price,
                                    payment: {
                                        type: payment,
                                        payment_multi: payment_multi
                                    },
                                    first_match: j == 0 && i == 0 ? true : false,
                                    free_hour: free_hour,
                                    method: method
                                }, (provider)? provider.id:null)
                            } catch (err) {
                                console.log(err);
                                errors.push(err.toString())
                            }
                            
                            if (!stack && contacts) {
                                if (contacts.length > 0) {
                                    for (var i=0;i<contacts.length;i++) {
                                        var contact = await Utility.Creator.matchContact({
                                            match_id: match.id,
                                            name: contacts[i].name,
                                            phone_number: contacts[i].phone_number
                                        })
                                    }
                                }
                            }

                            if (match) {
                                matches.push(match.toJSON())
                            }
                        }

                        if(share_court_env){
                        //share_match
                            for(let i =0; i<matches.length; i++){
                                const index = i
                                const share_match = await Match.find(matches[index].id)
                                const target = (index%2==0)
                                await share_match.merge({
                                    share_match_id: matches[target?index:index-1].id,
                                    is_share_court: 1,
                                    total_price: target? share_match.total_price:0 
                                })
                                await share_match.save()
                            }
                        }
                        
                    } catch (err) {
                        console.log(err);
                        errors.push(err.toString())
                    }
                }
            }

            var total_match_target = courts.length*round
            if ((total_match_target != attemps.length) && !share_court_env){
                var stack_id = stack? stack.id:null
                var match_ids = matches.map(m => m.id)
                await Utility.Query.cancel_stack(stack_id, match_ids)
                attemps = []
            }

            if (payment == 'online') {
                await Utility.Checker.check_unpaid_match(matches.map(m => m.id), stack? { type: 'stack', id: stack.id}:null)
            } else {
                /* Email Sender */
                var email = []
                if (send_mail && matches.length > 0) {
                    //push noti 
                    await Utility.Notification.notificationSender({matches, user, type: 'CreateMatch'}, provider.id)

                    const email_result = Utility.Email.emailSender({
                        type: 'CreateMatch',
                        courts: courts,
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
                        match: (matches.length > 0)? matches:null,
                        stack: (stack)? stack.id:null,
                        matchday: send_mail
                    })
                    email.push(email_result)
                }
            }
            
            const result = {
                attempted: attemps.length,
                matches: matches,
                email: email,
                errors: errors,
            }

            return result
        },
        async matchContact ({ stack_id, match_id, name, phone_number }) {
            try {
                const input = { stack_id, match_id, name, phone_number }
                const contact = await ContactMatch.create(input)
                await contact.save()
                
                return contact
            } catch (err) {
                return err
            }
        },
        async matchServices ({ match_id, services }) {
            try {
                const input = services.map(s => s = { match_id: match_id, service_id: s.service_id, amount: s.amount ,price: s.price})
                const service = await MatchService.createMany(input)
                return service
            } catch (err) {
                console.log(err);
                return err
            }
        },
        async useInventory ({ match_id, inventories, created_at, staff_id}) {
            try {
                const input = inventories.filter(i => i.inventory_id).map(i => {
                    Loging.Inventory.addHisTory(7, i.inventory_id, null, { refill: i.amount })

                    return { 
                            match_id: match_id,
                            inventory_id: i.inventory_id,
                            amount: i.amount ,
                            price: i.price,
                            created_at: created_at ? created_at : moment().format(timeFormat),
                            updated_at: moment().format(timeFormat), staff_id
                    }
                })
                const inventory = await UsedInventory.createMany(input)
                return inventory
            } catch (err) {
                console.log(err);
                return err
            }
        },
    },
    Manage: {
        Service: {
            async update(update, match_id) {
                try{
                    for (var i=0;i<update.length;i++) {
                        const { amount, id } = update[i]
                        var result;
                        if (id) result = await MatchService.find(id)
                        if (result) {
                            if (amount == 0) {
                                await result.delete()
                                result = null
                            } else {
                                await result.merge({ amount: amount })
                                await result.save()
                                result = null
                            }
                        } else {
                            await Utility.Creator.matchServices({ match_id: match_id, services: [update[i]] })
                            result = null
                        }
                    }
                    return {'update':'success'}
                }catch(err){
                    console.log(err);
                     return {'fail':err}
                }   
            },
            async create({match_id, create}) {
                return await Utility.Creator.matchServices({ match_id: match_id, services: create })
            },
            async remove(remove) {
                try{
                    for (var i=0;i<remove.length;i++) {
                        const delete_MatchService = await MatchService.find(remove[i])
                        await delete_MatchService.delete()
                    }
                    return {'remove':'success'}
                }catch(err){
                    return {'fail':err}
                }   
              
            },
        },
        Inventory: {
            async update(update, match_id) {
                try{
                    for (var i=0;i<update.length;i++) {
                        var { amount, id } = update[i]
                        var result;

                        if (id) {
                            result = await UsedInventory.find(id)

                            if (amount == 0) {
                                await result.delete()
                            } else {
                                await result.merge({ amount: amount })
                                await result.save()
                            }
                        } else {
                            await Utility.Creator.useInventory({ match_id: match_id, inventories: [update[i]] })
                        }
                    }

                    return {'update':'success', result }
                }catch(err){
                    console.log(err);
                     return {'fail':err}
                }  

            },
            async create({match_id, create}) {
                return  await Utility.Creator.useInventory({ match_id: match_id, inventories: create })
            },
            async remove(remove) {
                try{
                    for (var i=0;i<remove.length;i++) {
                        const delete_UsedInventory = await UsedInventory.find(remove[i])
                        await delete_UsedInventory.delete()
                    }
                    return {'remove':'success'}
                }catch(err){
                    return {'fail':err}
                }   
               
            },
        }
    },
    Mutator: {
        fixed_price_duration(price, [time_start,time_end]) {
            const duration = moment(time_end,timeFormat).diff(moment(time_start,timeFormat).subtract(1,'minutes'),'hours',true)
            return parseFloat(price)*parseFloat(duration)
        },
        product_name(product, lang) {
            const names = {
                Bundle: {
                    th: 'คูปอง',
                    en: 'Voucher'
                },
                Match: {
                    th: 'สนาม',
                    en: 'Stadium'
                },
                Stack: {
                    th: 'แมทช์ต่อเนื่อง',
                    en: 'Stadiums'
                }
            }
            return lang? names[product][lang]:names[product]
        },
        productdetail_to_object(string) {
            const array = string.split('-')
            return {
                type: array[1],
                id: array[2],
                amount: array[4],
                user_id: array[6]
            }
        },
        time_corrector(time) {
            return (parseFloat(time) >= 24)? `${parseFloat(time)-24}:00`:time
        },
        number_to_alphabet(number) {
            return (number + 9).toString(36).toUpperCase()
        },
        sumServices(services) {
            var prices = []
            services.forEach(i=>{
                prices.push(i.amount*i.price) 

            })
            if (prices.length > 1) {
                return prices.reduce((a,b)=> a + b)
            } else {
                return parseInt(prices[0],10)
            }
        },
        repeatBookDate (time, type, days) {
            return moment(time,timeFormat).add(days,type).format(timeFormat)
        },
        getMatchName (match) {
            return (match.user)? match.user.fullname:((match.description)? match.description.split(' ')[0]:'')
        },
        getMatchPhone (match) {
            return (match.user)? match.user.phone_number:((match.description)? ((match.description.split(' ')[match.description.split(' ').length - 1].length == 10)?  match.description.split(' ')[match.description.split(' ').length - 1]:''):'')
        },
        getMatchPrice (match) {
            const dur = moment(match.time_end,timeFormat).diff(moment(match.time_start,timeFormat).subtract(1,'minutes'),'hours',true)
            return (match.total_price)? match.total_price:match.court.price*dur
        },
        getMatchPaymentDetail(match) {
            return {
                total: match.total_price,
                paid: (match.promotion || match.used_bundle)? match.total_price:match.paid_amount,
                unpaid: match.total_price-match.paid_amount,
                promotion: match.promotion,
                voucher: match.used_bundle? (match.used_bundle.asset_bundle? (match.used_bundle.asset_bundle.bundle? match.used_bundle.asset_bundle.bundle.name:null):null):null,
                deposit: match.deposit_amount
            }
        },
        getMatchStatus (match) {
            if (match.match_discount) {
                const discount = match.match_discount.total_discount
                const diff = match.total_price - discount
                return  match.paid_amount > 0 && ( match.paid_amount+ discount) < match.total_price ? 'dep' : diff <= match.paid_amount ? 'paid': 'unpaid'
            } else if (match.total_price == 0) {
                return 'paid'
            } else {
                return (match.total_price)? /* if it have total price ? */
                    ((match.paid_amount > 0)? ((match.paid_amount>= match.total_price )? 'paid':'dep'):'unpaid'): /* if it fully paid ? */
                    ((moment(match.time_end,timeFormat).unix() < moment().unix())? (match.check_in? 'paid':'unpaid'):'unpaid')/* if it ended ? */
            }
        },
        getPricePromotion(match){
            const promotion = match.promotion
                var promotion_price = 0
                if(promotion.type=='value'){
                    promotion_price =  promotion.value > match.match_price?match.match_price:promotion.value
                }else if(promotion.type=='percent'){
                    promotion_price = ((promotion.value * match.match_price)/100)
                    promotion_price = promotion_price > match.match_price?match.match_price:promotion_price
                }    
            return  promotion_price   
        },
        getMatchPriceSummary(match){
            if(match.total_price == (match.paid_amount)){
                return match.total_price
            }else{
                if(match.paid_amount>0){
                    return match.total_price-match.paid_amount
                }else{
                    return match.total_price
                }
            }
        },
        getMatchPaidAmount(match){
            if(match.match_discount){
                const discount = match.match_discount.total_discount
                const paid = discount + match.paid_amount
                return match.paid_amount <= 0 ? match.paid_amount : paid
            }else{ 
                return match.paid_amount
            }
        },
        getMatchNetPrice(match){
            return match.match_discount
                    ? match.total_price - match.match_discount.total_discount 
                    : match.total_price
        },
        getMatchUnpaid(match){
            return  match.match_discount
            ? match.total_price - (match.match_discount.total_discount + match.paid_amount)
            : match.total_price - match.paid_amount
        },
        getMatchReview(match) {            
            let now = moment().add(15,'minutes').unix()
            let timeEnd = moment(match.time_end,'YYYY-MM-DD HH:mm').unix()

            if (timeEnd < now) {
                return (match.ratings.length > 0)? true:false
            } else {
                return false
            }
        },
        getMatchPayment (match) {
            try {
                const payment = JSON.parse(match.payment)
                return payment ? payment.type : match.paid_amount > 0 ? 'online':'cash'
            } catch (err) {
                return 'cash'
            }
        },
        async sp_idFromUrl(url) {
            if (parseFloat(url) > 0) {
                return url
            } else {
                const sp = await Provider.findBy('url_nickname',url)
                return sp.id
            }
        },
        matchTimeSwitch(matchTime, input, expect) {
            matchStart = moment(matchTime.time_start, timeFormat).unix()
            matchEnd = moment(matchTime.time_end, timeFormat).unix()
            inputStart = moment(input.time_start, timeFormat).unix()
            inputEnd = moment(input.time_end, timeFormat).unix()
            
            if (expect == 'time_start') {
                return (inputStart <= matchStart)? input.time_start:moment(matchTime.time_end,timeFormat).add(1,'minutes').format(timeFormat)
            } else {
                return (inputEnd >= matchEnd)? input.time_end:moment(matchTime.time_start,timeFormat).subtract(1,'minutes').format(timeFormat)
            }
        },
        async getInventoriesRemaining(inventories){
            inventories.forEach(async (i)=>{
                i.remaining = 0
                var use = 0
                var totalAmount = 0
                i.inventory_histories.map(history=>{
                    if(history.status == 3 || history.status == 4){
                        totalAmount =  totalAmount+history.refill
                    }
                    if(history.status == 5 ){
                        totalAmount =  totalAmount-history.refill
                    }
                })
                i.used_inventory.map(used=>{
                     use = use + used.amount
                   
                })
                i.remaining = ( totalAmount- use)

                if (!i.remaining_amount) {
                    console.log('updating');
                    const inventory = await Inventory.find(i.id)
                    await inventory.merge({ remaining_amount: i.remaining })
                    await inventory.save()

                    console.log({ remaining_amount: i.remaining });
                }

                delete i.inventory_histories
                delete i.used_inventory
            })
            return inventories
        },
        month_ledger_counter(day_target, at_date) {
            const counting = {
                date: moment(at_date,timeFormat).format('DD MMM YYYY'),
                ranges: []
            }
            const ddMM = 'DD-MM'
            const start_of_month = moment(at_date,timeFormat).startOf('month')
            const end_of_month = moment(at_date,timeFormat).endOf('month')

            const first_day = moment(at_date,timeFormat).day(day_target)

            const skip_first_week = (moment(first_day).diff(moment(start_of_month),'days') < 4)
            const start_date = skip_first_week? first_day:moment(first_day).subtract(7,'days')

            for (var i=0;i<5;i++) {
                var start = moment(start_date).add((i*7),'days')
                var end = moment(start).add(7,'days')

                if (i==0) counting.start_at = moment(start,timeFormat).format(timeFormat)
                counting.total_weeks = i+1
                counting.ranges.push([ start.format(ddMM), end.format(ddMM) ])
                if (end_of_month.diff(end,'days') < 3) break;
            }
            return counting
        },
        async share_court_correction(court_type_id, courts) {
            var share_courts = await Court
                .query()
                .where('sub_court_type_id', court_type_id)
                .select('id')
                .fetch()

            const courtType = await CourtType.find(court_type_id)

            share_courts = share_courts.toJSON()
            share_courts = share_courts.map(c => c.id)
            return {
                is_share_court: (share_courts.length>0),
                valid_courts: share_courts.length>0? share_courts:courts,
                is_free_hour: courtType.free_hour
            }
        },
        filter_share_match(matches, share_court_key = 'is_share_court'){
            var share_match_id
            return matches.filter(m=>{
                if(m[share_court_key] == 1){
                    if(m.share_match_id != share_match_id){
                        share_match_id = m.share_match_id
                        return m
                    }
                    share_match_id = null
    
                }else{
                    return m
                }
            })
        }
    },
    Validator: {
        check_court_input(courts) {
            var check = courts[0]
            if (typeof check == 'array') {
                return courts[0]
            } else {
                return courts
            }
        },
        user_fullname(name, type) {
            if (type == 'fullname') {
                return name
            } else {
                return (type == 'firstname')? name.split(' ')[0]:name.split(' ')[name.split(' ').length-1]
            }
        },
        detectMatchTime([matchStart, matchEnd], time_end) {
            if ((moment(time_end,timeFormat).unix() > moment(matchStart,timeFormat).unix() && moment(time_end,timeFormat).unix() > moment(matchEnd,timeFormat).unix()) ||
            (moment(time_end,timeFormat).unix() < moment(matchStart,timeFormat).unix() && moment(time_end,timeFormat).unix() > moment(matchEnd,timeFormat).unix())) {
                return false
            } else {
                return true
            }
        },
        matchTimeInput (time_start, time_end) {
            var rule_1 = moment(time_end,timeFormat).diff(moment(time_start,timeFormat),'minutes')
            return (parseInt(rule_1,10)%30 == 0)? moment(time_start,timeFormat).add(1,'minutes').format(timeFormat):time_start
        },
        checkDay_timeEnd(time_start, time_end) {
            const com_start = moment(time_start, timeFormat).unix()
            const com_end = moment(time_end, timeFormat).unix()
            if (com_start > com_end) {
                return moment(time_end, timeFormat).add(1, 'days').format(timeFormat)
            } else {
                return time_end
            }
        },
        time_slot_close_time(start, end) {
            const today = moment().format('YYYY-MM-DD')
            const com_start = moment(`${today} ${start}`, timeFormat).unix()
            const com_end = moment(`${today} ${end}`, timeFormat).unix()
            if (com_start > com_end) {
                const hh = end.split(':')[0]
                const mm = end.split(':')[1]
                return `${parseFloat(hh)+24}:${mm}`
            } else {
                return end
            }
        }
    },
    Email: {
        async emailSender({ type, user, provider, match, stack, owner, courts }) {
            try {
                const courtsName = await Database.from('courts').whereIn('id',courts).select('name')
                const payment_lang = {
                    paid: {
                        th: 'ชำระแล้ว',
                        en: 'paid'
                    },
                    unpaid: {
                        th: 'ค้างชำระ',
                        en: 'unpaid'
                    },
                    depo: {
                        th: 'มัดจำ',
                        en: 'deposited'
                    }
                }
                
                var alter_userObj = null
                if (!user) {
                    var matchObj = await Match.find(match[0].id)
                    await matchObj.load('user')
                    matchObj = matchObj.toJSON()
                    alter_userObj = matchObj.user
                }

                /* Insert Booker */
                match = match.map(m => {
                    m.day = moment(m.time_start,timeFormat).format('DD/MM/YYYY')
                    m.time_start = moment(m.time_start,timeFormat).subtract(1,'minutes').format('HH:mm')
                    m.time_end = moment(m.time_end,timeFormat).format('HH:mm')
                    m.provider = provider.fullname
                    m.provider_tel = provider.phone_number
                    m.user = (user)? user:alter_userObj
                    m.courts = courtsName.map(c => c = c.name)
                    m.payment = payment_lang[Utility.Mutator.getMatchStatus(m)]
                    return m
                })

                var sent = []
                for (var i=0;i<match.length;i++) {
                    /* Sender Name */
                    const sender = 'Matchday'
                    var info = match[i]

                    if (user || alter_userObj) {
                        info.lang = user.lang
                        info.joiner = (type == 'JoinMatch')? user.fullname:null
                        const email = await Mail.send(`email.actions.${type}`, info, (message) => {
                            message
                            .to(user.email)
                            .from(sender)
                            .subject(Utility.Email.emailTitle(user.lang, type, info.id,(stack)? stack:undefined))
                        })
                        sent.push((email.accepted)? `success - ${email.accepted}`:`fail - ${email.reader}`)
                    }

                    if (owner) {
                        info.lang = owner.lang
                        const email = await Mail.send(`email.actions.${type}`, info, (message) => {
                            message
                            .to(owner.email)
                            .from(sender)
                            .subject(Utility.Email.emailTitle(owner.lang, type, info.id,(stack)? stack:undefined))
                        })
                        sent.push((email.accepted)? `success - ${email.accepted}`:`fail - ${email.reader}`)
                    }

                    if (matchday) {
                        const email = await Mail.send(`email.actions.${type}`, info, (message) => {
                            message
                            .to('booking.matchday@gmail.com')
                            .from('booking.matchday@gmail.com')
                            .subject(Utility.Email.emailTitle('th', type, info.id,(stack)? stack:undefined))
                        })
                        sent.push((email.accepted)? `success - ${email.accepted}`:`fail - ${provider.email}`)
                    }

                    if (provider) {
                        info.lang = provider.lang
                        const email = await Mail.send(`email.actions.${type}`, info, (message) => {
                            message
                            .to(provider.email)
                            .from(sender)
                            .subject(Utility.Email.emailTitle((provider.lang)? provider.lang:'th', type, info.id,(stack)? stack:undefined))
                        })
                        sent.push((email.accepted)? `success - ${email.accepted}`:`fail - ${provider.email}`)
                    }

                }
                
                console.log({ mailType: type, sent: sent.toString() });
                return { mailType: type, sent: sent.toString() }
            } catch (err) {
                console.log(err);
            }
        },
        emailTitle(lang, type, id, stack) {
            const title = {
                CreateMatch: {
                    en: `Booking Success! ID: ${id} ${stack? ` | StackID: ${stack.id}`:''}`,
                    th: `การจองสำเร็จ! รหัสการจอง ${id} ${stack? ` | จองต่อเนื่อง ${stack.id}`:''}`
                },
                PosSubscription: {
                    en: 'Your Subscription Receipt is Ready!',
                    th: 'ใบเสร็จรับเงิน รายละเอียดการสมัครสมาชิก'
                },
                CancelMatch: {
                    en: 'Canceled Your Match! ID:'+id,
                    th: 'การจองถูกยกเลิก! รหัสการจอง:'+id
                },
                UpdateMatch: {
                    en: 'Booking updated! Booking ID:'+id,
                    th: 'การจองมีการเปลี่ยนแปลง! รหัสการจอง:'+id
                },
                UrgentUpdate: {
                    en: 'Your Booking is Updating! BookingID:'+id,
                    th: 'แมทช์ของคุณกำลังได้รับการแก้ไข! รหัสการจอง:'+id
                },
                IncomingMatch: {
                    en: 'Match comming! Booking ID:'+id,
                    th: 'แมทช์ที่กำลังจะมาถึง! รหัสการจอง:'+id
                },
                PaymentMatch: {
                    en: 'Payment receipt Booking ID:'+id,
                    th: 'ใบเสร็จรับเงิน รหัสการจอง:'+id
                },
                JoinMatch: {
                    en: 'Player joined Booking ID:'+id,
                    th: 'ผุ้เล่นเข้าร่วม! รหัสการจอง:'+id
                },
                Receipt: {
                    en: 'Thank you for your purchase! RefNO:'+id,
                    th: 'ขอบคุณสำหรับการชำระเงิน! หมายเลขอ้างอิง:'+id
                }
            }
            return title[type][lang]
        },
        async create_receipt(refno, matchday) {
            try {
                var payment = await Payment.findBy('refno', refno)
                if (payment) {
                    payment = payment.toJSON()
                    var receipt_data = await Utility.Query.product_to_receipt(refno,Utility.Mutator.productdetail_to_object(payment.productdetail))
                    var user = await User.find(Utility.Mutator.productdetail_to_object(payment.productdetail).user_id)

                    const receipt_email_obj = {
                        refno: payment.refno,
                        total_paid: payment.total,
                        date: moment(payment.created_at,timeFormat).format('DD/MM/YYYY'),
                        time: moment(payment.created_at,timeFormat).format('HH:mm'),
                        provider: receipt_data.provider.fullname,
                        user: {
                            fullname: user.fullname,
                            email: user.email,
                            phone_number: user.phone_number,
                            lang: user.lang
                        },
                        product: receipt_data.product,
                        price_list: receipt_data.list_items
                    }
                    
                    var sent = []
                    const email = await Mail.send(`email.store.Receipt`, receipt_email_obj, (message) => {
                        message
                        .to(receipt_email_obj.user.email)
                        .from('Matchday')
                        .subject(Utility.Email.emailTitle(receipt_email_obj.user.lang, 'Receipt', refno))
                    })
                    sent.push((email.accepted)? `success - ${email.accepted}`:`fail - ${email.reader}`)
                    
                    if (matchday) {
                        const email = await Mail.send(`email.store.Receipt`, receipt_email_obj, (message) => {
                            message
                            .to(matchday)
                            .to('booking.matchday@gmail.com')
                            .from('Matchday')
                            .subject(Utility.Email.emailTitle(receipt_email_obj.user.lang, 'Receipt', refno))
                        })
                        sent.push((email.accepted)? `success - ${email.accepted}`:`fail - ${email.reader}`)
                    }

                    console.log({ sent: sent.toString() });
                    return { sent: sent.toString() }
                } else {
                    throw `Payment Refno ${refno} NOT FOUND`
                }
            } catch (err) {
                console.log(err);
            }
        },
        async basic_noti({ user,user_id, bundle,bundle_id, asset_bundle, asset_bundle_id }, title) {
            if (user_id) {
                user = await User.find(user_id)
            }
            if (bundle_id) {
                try {
                    bundle = await Bundle.find(bundle_id)
                    await bundle.load('provider')
                } catch (err) {
                    console.log(err);
                }
            }
            if (asset_bundle_id) {
                asset_bundle = await AssetBundle.find(asset_bundle_id)
            }

            const Email_info = {
                title: title,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone_number,
                sku: bundle.base_code,
                asset_bundle_id: asset_bundle_id? asset_bundle_id:asset_bundle.id,
                redeem_code: asset_bundle.redeem_code,
                date: moment(asset_bundle.created_at, timeFormat).format('DD/MM/YYYY HH:mm'),
                provider: bundle.toJSON().provider.fullname
            }

            var sent = []
            const email = await Mail.send(`email.notification.basic`, Email_info, (message) => {
                message
                    .to('booking.matchday@gmail.com')
                    .from('booking.matchday@gmail.com')
                    .subject(`[MATCHDAY] มี${title}รายการใหม่! ${bundle.base_code}`)
            })
            sent.push((email.accepted)? `success - ${email.accepted}`:`fail`)
        },
        async create_pos_paid_receipt({ refno, bankno, matchday }) {
            var sent = []
            if (refno) {
                var { refno,productdetail, total, created_at } = await Payment.findBy('refno',refno)
                const { amount, user_id } = Utility.Mutator.productdetail_to_object(productdetail)
                total = parseFloat(total)
                
                var package_order = await PosSubscription.findBy('provider_id', user_id)
                await package_order.loadMany(['package','provider'])
                package_order = package_order.toJSON()

                const { provider, package, end_date } = package_order
                const { id, fullname, email, lang } = provider
                const { name, price } = package

                const email_content = {
                    lang: lang,
                    name: fullname,
                    refno: `${id}-${refno}`,
                    receipt_maker: email,
                    package_name: name,
                    amount: amount,
                    price: price,
                    expire_date: moment(end_date,timeFormat).format('DD/MM/YYYY'),
                    payment_date: moment(created_at, timeFormat).format('DD/MM/YYYY'),
                    discount: 0,
                    total: total,
                    payment_method: 'Online'
                }
                
                const emailSender = await Mail.send(`email.actions.PosSubscription`, email_content, (message) => {
                    message
                    .to(email)
                    .from('Matchday')
                    .subject(Utility.Email.emailTitle(lang, 'PosSubscription'))
                })
                sent.push((emailSender.accepted)? `success - ${emailSender.accepted}`:`fail - ${emailSender.reader}`)

                if (matchday) {
                    const emailSender = await Mail.send(`email.actions.PosSubscription`, email_content, (message) => {
                        message
                        .to('booking.matchday@gmail.com')
                        .from('Matchday')
                        .subject(Utility.Email.emailTitle(lang, 'PosSubscription'))
                    })
                    sent.push((emailSender.accepted)? `success - ${emailSender.accepted}`:`fail - ${emailSender.reader}`)
                }
            } else if (bankno) {

            }
            console.log({ sent: sent.toString() });
        }
    },
    Tools: {
        getDistanceFromLatLngInKm({ lat, lng },{ user_lat, user_lng},type) {
            function deg2rad(deg) {
                return deg * (Math.PI/180)
            }
            const Radius_type = {
                miles: 3959,
                km: 6371
            }
            let R = Radius_type[type]; // Radius of the earth in km
            let dLat = deg2rad(user_lat - lat); // deg2rad below
            let dLng = deg2rad(user_lng - lng);
            let a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(deg2rad(lat)) *
                Math.cos(deg2rad(user_lat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            let d = R * c; // Distance in km
        
            return Math.round((d + Number.EPSILON) * 100) / 100;
        },
        bundle_expire_date({ total_days, until_date }, method) {
            const methods = {
                start: () => total_days? moment().format(timeFormat):null,
                end: total_days? () => {
                    const max_date = until_date? until_date:moment().add(parseFloat(total_days),'days').format(timeFormat)
                    const variants = {
                        unix: {
                            target: moment().add(parseFloat(total_days),'days').unix(),
                            max: moment(max_date,timeFormat).unix()
                        },
                        result: {
                            target: moment().add(parseFloat(total_days),'days').format(timeFormat),
                            max: moment(max_date,timeFormat).format(timeFormat)
                        }
                    }

                    return (variants['unix']['target'] <= variants['unix']['max'])? variants['result']['target']:variants['result']['max']
                }:() => null
            }
            return methods[method]()
        },
        getRepeatedDay(matches) {
            var datePool = []
            matches.map(m => {
                const day = moment(m.time_start,timeFormat).startOf('day').format('DD')
                datePool.push(parseInt(day,10))
            })
            if (((datePool[0]+7) || (datePool[0]-7)) == datePool[1]) {
                return {
                    type: 'week',
                    days: datePool.length
                }
            } else if (datePool[0] == datePool[1]) {
                return {
                    type: 'court',
                    days: datePool.length
                }
            } else {
                return {
                    type: 'day',
                    days: datePool.length
                }            
            }
        },
        match_timeDivider_monthToWeeks(array, [time_start, time_end]) {
            var dif = moment(time_end,timeFormat).diff(moment(time_start,timeFormat),'day')+8
            var weeks = []

            while (dif > 8) {
                dif = dif-8
                const end = moment(time_start,timeFormat).add(dif,'days').subtract(1,'minutes').format(timeFormat)
                const start = moment(time_start,timeFormat).add((dif-8>0)? dif-8:0,'days').format(timeFormat)
                weeks.push({
                    start: start,
                    end: end, 
                    week:Math.round(dif/8),
                    matches: array.filter(m => {
                        const checkStart = (moment(m.time_start,timeFormat).unix() >= moment(start,timeFormat).unix()) 
                        const checkEnd = (moment(m.time_end,timeFormat).unix() <= moment(end,timeFormat).unix()) 
                        if (checkStart && checkEnd) {
                            return m
                        }
                    }).map(m => m = { 
                        id: m.id,
                        time_start: m.time_start,
                        time_end: m.time_end,
                        total_price: m.total_price,
                        court: m.court.name,
                        sport: { 
                            id: m.court.court_type.provider_sport.sport.id,
                            name: m.court.court_type.provider_sport.sport.name
                        },
                        user: m.user,
                    })
                })
            }
            
            return weeks
        },
        match_timeDivider_monthToTime(array,[time_start, time_end],[min,max]) {
            var total_hours = parseInt(max,10) - parseInt(min,10)
            var time_slot = []

            var h = 0
            while (h < total_hours) {
                var matches = []
                var start_min = (parseInt(min,10))
                const range_start = moment(time_start,timeFormat).add(h+start_min,'hours').format(timeFormat)
                const range_end = moment(time_start,timeFormat).add(h+start_min+1,'hours').format(timeFormat)

                array.forEach(m => {
                    if (m.time_start.includes(`${h+start_min<10? `0${h+start_min}`:h+start_min}:`)) {
                        matches.push({
                            id:m.id,
                            time_start: m.time_start,
                            time_end: m.time_end
                        })
                    }
                })
                if (matches.length > 0) {
                    time_slot.push({
                        range:`${moment(range_start,timeFormat).format('HH:mm')} - ${moment(range_end,timeFormat).format('HH:mm')}`,
                        matches: matches.length
                    })
                }

                h = h + 1
            }
            
            return time_slot.sort((a,b)=> a.matches - b.matches).map((e,i) => t = { no: i+1, time: e.range, rate: parseFloat(((e.matches/array.length)*100).toFixed(2))})
        },
        rate_of_frequency(result) {
            var slots = {}
            result.days.forEach(day => {
                day.time_slot.filter(slot => {
                    const time = slot.range.toString().replace(',',' - ')
                    if (slots[time]) {
                        slots[time].days = slots[time].days + 1
                        slots[time].matches = parseInt(slots[time].matches,10) + parseInt(slot.matches,10)
                    } else {
                        slots[time] = {
                            days: 1,
                            matches: slot.matches
                        }
                    }
                })
            })
            var toArray = []
            for (var time in slots) {
                slots[time].matches = parseFloat(((slots[time].matches/result.matches)*100).toFixed(2))
                toArray.push({
                    time: time,
                    rate: slots[time].matches
                })
            }
            toArray = toArray.sort((a,b)=> parseInt(a.time,10)-parseInt(b.time,10)).map((e,i) => e = { no: i+1, time: e.time, rate: e.rate})
            return toArray
        },
        continuous_number(array) {
            var result = []
            for(var i=0;i<array.length;i++) {
                if (i == 0) {
                    result.push(array[i])
                } else {
                    if (array[i]+1 == array[i+1]) {
                        if ((array[i]-array[i-1])>1) {
                            result.push(array[i])
                        } else {
                            result.push(0)
                        }
                    } else {
                        result.push(array[i])
                    }
                }
            }
            var final = []
            for(var i=0;i<result.length;i++) {
                if ((result[i] == 0) && (result[i+1] != 0)) {
                    final.push('-')
                } else if (result[i] != 0) {
                    final.push(result[i])
                }
            }
            return final.toString().replace(/\,/g,'')
        }
    },
    Query : {
        async get_nearest_sp_ids({ lat, lng }) {
            nearest_provider_ids = await Database.raw(`SELECT id,
                        (
                        6371 *
                        acos(cos(radians(${lat})) * 
                        cos(radians(lat)) * 
                        cos(radians(lng) - 
                        radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(lat )))
                        ) AS distance 
                        FROM providers 
                        ORDER BY distance`)

            nearest_provider_ids = nearest_provider_ids[0].map(s => s.id)
            return nearest_provider_ids
        },
        async query_provider(page, query_params) {
                try {
                const by_district_id = query_params.by_district_id
                const by_province_id = query_params.by_province_id
                const search = query_params.search
                const per_page = query_params.per_page? query_params.per_page:30
                const sport = query_params.sport
                const stars = query_params.stars
                const court_type = query_params.court_type
                const ground_type = query_params.ground_type
                const lat = parseFloat(query_params.lat)
                const lng = parseFloat(query_params.lng)
                const facility = query_params.facility
                const rating = query_params.rating
                const price_range = (query_params.price_range)? query_params.price_range.split(',').map(n => parseFloat(n)):null
                const court_size = query_params.court_size
                const lang = query_params.lang? query_params.lang:'th'
                const size_rule = { s: [0,5], m: [6,10], l: [11,20] } //Temporary
                const filled = query_params.filled? query_params.filled:false

                var time_start = query_params.time_start
                var time_end = query_params.time_end
                time_start = Utility.Validator.matchTimeInput(time_start, time_end)
                time_end = Utility.Validator.checkDay_timeEnd(time_start, time_end)

                const providers_query = await Provider
                    .query()
                    .where('hidden_page',0)
                    .with('provider_sports.sport')
                    .where(function() {
                        if (sport) {
                            this.whereHas('provider_sports',(ps) => {
                                ps.whereHas('sport', (s) => {
                                    s.whereIn('id',sport.map(id => Number(id)))
                                })
                            })
                        }
                        if (court_type || court_size || ground_type) {
                            this.whereHas('provider_sports', (ps)=> {
                                ps.whereHas('court_types',(ct)=> {
                                    if (court_size) {
                                        if (court_size == 'อื่นๆ') {
                                            ct.where('max_team_size','>=',21)
                                        } else {
                                            ct.whereIn('max_team_size',size_rule[court_size])
                                        }
                                    }
                                    if (court_type) {
                                        ct.orWhere('name','like', `%${court_type}`)
                                        if (court_type == 'etc') {
                                            ct.whereNotIn('type',['Indoor','Outdoor'])
                                        } else {
                                            ct.orWhere('type','like', `%${court_type}`)
                                        }
                                    }
                                    if (ground_type) {
                                        if (ground_type == 'อื่นๆ') {
                                            ct.whereNotIn('ground_type',['หญ้าจริง','หญ้าเทียม'])
                                        } else {
                                            ct.where('ground_type',ground_type)
                                        }
                                    }
                                })
                            })
                        }
                        if (search) {
                            console.log(search);
                            this.orWhere('fullname', 'LIKE', `%${search}%`)
                            this.orWhere('nearby_location', 'LIKE', `%${search}%`)
                            this.orWhere(function() {
                                if (by_district_id || by_province_id) {
                                    this.whereHas('address', (address) => {
                                        if (by_district_id) { 
                                            address.where('district_id', by_district_id)
                                        }
                                        if (by_province_id) { 
                                            address.where('province_id', by_province_id)
                                        }
                                    })
                                } else {
                                    this.where('location', 'LIKE', `%${search}%`)
                                }
                            })
                        }
                        if (facility) {
                            this.whereHas('facilities', (fac) => {
                                fac.whereIn('name', facility)
                                fac.orWhereIn('name2', facility)
                            })
                        }
                        if (stars) {
                            this.where('stars', stars)
                        }
                    })
                    .with('facilities')
                    .with('ratings')
                    .with('photos')
                    .with('court_types', (court_type) => {
                        court_type.with('time_slots.slot_prices')
                        court_type.with('courts')
                    })
                    .with('matches', (match) => {
                        match.where('cancel', 0)
                        match.where(function() {
                            this.whereBetween('time_start', [time_start, time_end])
                            this.orWhereBetween('time_end', [time_start, time_end])
                            this.orWhere(function () {
                                this.where('time_start', '<=', time_start)
                                this.where('time_start', '<=', time_end)
                                this.where('time_end', '>=', time_start)
                                this.where('time_end', '>=', time_end)
                            })
                        })
                    })
                    .with('address', (a) => {
                        a.with('province')
                        a.with('district')
                    })
                    .fetch()

                var result = providers_query.toJSON()
                result = result
                    .filter(({ provider_sports }) => {
                        if (sport) {
                            return provider_sports.filter(({ sport_id }) => sport.includes(sport_id.toString())).length > 0
                        } else {
                            return true
                        }
                    })
                    // .filter((a) => {
                    //     if (lat && lng) {
                    //         const distance = Utility.Tools.getDistanceFromLatLngInKm({ lat: a.lat, lng: a.lng}, { user_lat: lat, user_lng: lng }, 'km')
                    //         return (distance <= 700)
                    //     } else {
                    //         return true
                    //     }
                    // })
                    .sort((a,b) => {
                        if (lat && lng) {
                            const distanceA = Utility.Tools.getDistanceFromLatLngInKm({ lat: a.lat, lng: a.lng}, { user_lat: lat, user_lng: lng }, 'km') - (a.available * 1000)
                            const distanceB = Utility.Tools.getDistanceFromLatLngInKm({ lat: b.lat, lng: b.lng}, { user_lat: lat, user_lng: lng}, 'km') - (b.available * 1000)
                            a.distance = `${distanceA} ${'km'}`
                            b.distance = `${distanceB} ${'km'}`
                            return (distanceA - distanceB)
                        } else {
                            return b.available - a.available
                        }
                    })
                    .map(provider => {
                        provider.total_page = result.lastPage
                        provider.total_provider = result.total
                        provider.location = provider.address? `${FieldsLocale.translate(lang, provider.address.district,'district_name')}, ${FieldsLocale.translate(lang, provider.address.province,'province_name')}`:''
                        provider.fullname =  FieldsLocale.translate(lang, provider,'provider_name')
                        if (lat && lng) {
                            provider.distance  = Utility.Tools.getDistanceFromLatLngInKm({ lat: provider.lat, lng: provider.lng}, { user_lat: lat, user_lng: lng }, 'km')
                        }
                        if (provider.provider_sports.length > 0) {
                            provider.serving_court_types = Utility.Checker.check_business_time(provider, { time_start, time_end })
                            provider.serving_status = (provider.serving_court_types.length > 0)? true:false
                        } else {
                            provider.serving_status = true
                            provider.serving_court_types = []
                        }
                        if (provider.court_types.length > 0) {
                            provider.total_courts = provider.court_types.map(ct => ct = ct.courts.length).reduce((a,b)=> a+b)
                            provider.total_booked = provider.matches.length
                            provider.free_status = (provider.total_courts > provider.total_booked)? true:false

                        } else {
                            provider.free_status = false
                        }
                        var avg_rating = [0]
                        if (provider.ratings.length > 0) {
                            provider.ratings.forEach(rating => {
                                avg_rating.push(rating.score)
                            })
                            provider.ratings = parseFloat((avg_rating.reduce((a,b)=> a+b)/((avg_rating.length-1)>0? (avg_rating.length-1):0)).toFixed(2))
                            provider.cal_rating = parseFloat((avg_rating.reduce((a,b)=> a+b)/((avg_rating.length-1)>0? (avg_rating.length-1):0)).toFixed(0))
                            provider.rating_amount = provider.ratings.length
                            provider.number_of_reviews = avg_rating.length
                        } else {
                            provider.ratings = 0
                            provider.rating_amount = 0
                            provider.cal_rating = 0
                            provider.number_of_reviews = 0
                        }
                        var court_prices = []
                        if(provider.court_types.length>0) {
                            provider.court_types.forEach(ct=>{
                                court_prices.push(ct.courts.length >0 ? ct.courts[0].price : ct.price)
                            })
                        }else{
                            court_prices.push(0)
                        }
                        provider.price_per_hour = court_prices.sort((a,b)=> a-b)[0]
                        return provider
                    })
                    .filter(provider => {
                        if (rating) {
                            return provider.cal_rating == rating
                        } else {
                            return provider
                        }
                    })//Rating
                    .filter(provider => {
                        if (price_range) {
                            return provider.court_types.filter(court_type => (court_type.price >= price_range[0] && court_type.price <= price_range[1])).length > 0
                        } else {
                            return provider
                        }
                    })//Price

                return {
                    total: result.length,
                    perPage: parseInt(per_page),
                    page: parseFloat(page),
                    lastPage: parseFloat(Math.ceil(result.length/per_page)),
                    data: result.filter((sp,i) => {
                        if (page) {
                            const start = (i >= ((page-1)*per_page))
                            const end = (i < (page*per_page))
                            return (start && end)
                        } 
                        else true
                    })
                }
            } catch (err) {
                console.log(err);
                return { error: err.toString() }
            }
        },
        async product_to_receipt(refno,{ type, id, user_id },lang) {
            try {
                var provider;
                var product = {
                    type: 'Match',
                    label: 'ชื่อโปรโมชั่น',
                    name: 'Grass 1',
                    id: '22930',
                }//Template
                var list_items = [{
                    name: 'ราคาสนาม',
                    date_time: '19/02/2021 15:00 - 16:00',
                    price: '100'
                }]//Template
                const Product_list = {
                    Bundle: async function (id) {
                        var bundle = await Bundle
                            .query()
                            .where('id',id)
                            .with('provider')
                            .whereHas('asset_bundles',(ab)=> {
                                ab.whereHas('payment', (p)=> {
                                    p.where('refno',refno)
                                })
                            })
                            .with('asset_bundles',(ab)=> {
                                ab.whereHas('payment', (p)=> {
                                    p.where('refno',refno)
                                })
                            })
                            .fetch()
                        if (bundle) {
                            bundle = bundle.toJSON()[0]
                        } else {
                            throw 'No Such Bundle'
                        }
                        provider = bundle.provider
                        product.type = Utility.Mutator.product_name('Bundle',lang)
                        product.label = 'ชื่อโปรโมชั่น'
                        product.name = bundle.name
                        product.id = Utility.Tools.continuous_number(bundle.asset_bundles.map(ab => ab = ab.id))
                        list_items = bundle.asset_bundles.map(ab => ab = {
                            name: `${ab.redeem_code}`,
                            date_time: ab.expire_end? `หมดอายุภายใน ${moment(ab.expire_end,timeFormat).format('DD/MM/YYYY')}`:`ไม่มีวันหมดอายุ`,
                            limit: `จำนวนที่ใช้ได้ ${bundle.code_limits} ครั้ง`,
                            price: bundle.price
                        })
                    },
                    Match: async function (id) {
                        var match = await Match.find(id)
                        await match.load('provider')
                        provider = match.provider
                        product.type = Utility.Mutator.product_name('match',lang)
                        product.label = 'แมทช์'
                        product.name = match.name
                        product.id = id
                    }
                }

                await Product_list[type](id)

                return {
                    provider,
                    product,
                    list_items
                }
            } catch (err) {
                console.log(err);
            }
        },
        async cancel_stack(stack_id, match_ids) {
            try {
                if (stack_id) {
                    const delete_matches = await Stack
                        .query()
                        .where('id',stack_id)
                        .delete()
                }

                if (match_ids) {
                    const delete_matches = await Match
                            .query()
                            .whereIn('id',match_ids)
                            .delete()
                }
                console.log({stack_id, match_ids})
            } catch (err) {
                console.log(err);
            }
        }
    },
    FindOrCreate: {
        async user_phoneOrEmail({fullname, phone_number, email}) {
            var result = []
            const find_email = await User.findBy('email',email)
            if (find_email) {
                result.push(find_email)
            }
            if (result.length > 0) {
                return result[0]
            } else {
                const user = await User.create({ 
                    fullname:Utility.Validator.user_fullname(fullname,'fullname'),
                    firstname:Utility.Validator.user_fullname(fullname,'firstname'),
                    lastname:Utility.Validator.user_fullname(fullname,'lastname'),
                    phone_number: phone_number,
                    password: phone_number,
                    email: email,
                    pre_regis: 1
                })

                return user
            }
        },
        async user_asset(user_id) {
            var user = await Asset.findBy('user_id',user_id)
            if (user) {
                return user
            } else {
                user = await Asset.create({ user_id: user_id})
                return user
            }
        },
        async allow_prefix_pass(token) {
            var pass = await Token.findBy('token', token)
            if (pass) {
                pass = pass.toJSON()
                const now = moment().unix()
                const expire = moment(pass.expire_at).unix()

                return (expire < now)? false:true
            } else {
                return true
            }
        },
        async provider_pos_subscription(providerObj) {
            if (!providerObj.pos_subscription) {
                var pos_data = await PosSubscription.create({
                    provider_id: providerObj.id,
                    activated: true,
                    package_id: 1,
                    end_date: moment().add(30,'days').format(timeFormat)
                })
                await pos_data.load('package')
                providerObj.pos_subscription = pos_data
            }
            const { end_date, package} = providerObj.pos_subscription
            providerObj.pos_subscription.enable = package.level == 1 ? false : moment(end_date,timeFormat).diff(moment(),'day') > 0

            const amount = moment(end_date,timeFormat).diff(moment(),'day')
            providerObj.pos_subscription.amount = package.level == 1 ? 0 : amount > 0 ? amount : 0
            return providerObj
        }
    },
    Code_Generator: {
        async bundle_redeem_code({ digits }, redeem_code) {
            if (redeem_code) {
                return redeem_code
            } else {
                var checked = []
                var code = Utility.Code_Generator.code_shuffler(digits)
                var check = await AssetBundle.findBy('redeem_code',code)
                if (check) {
                    code = Utility.Code_Generator.code_shuffler(digits)
                    while (check) {
                        check = await AssetBundle.findBy('redeem_code',code)
                        checked.push(code)
                    }
                }
                console.log({ generated: code, attempts: { round: checked.length, found: checked }});
                return code
            }
        },
        code_shuffler(digits) {
            var digit = 1
            for (var i=0;i<digits;i++) {
                digit = digit*10
            }
            var result = (Math.floor(Math.random()*digit))
            while (result.toString().length < digits) {
                result = (Math.floor(Math.random()*digit))
            }

            return result
        }
    },
    UpdateOnPayment: {
        async pos_subscription(package_id, amount, sp_id) {
            var pos_subscription = await PosSubscription.findBy('provider_id',sp_id)
            const { end_date } = pos_subscription.toJSON()
            const isExpired = moment() <= moment(end_date,timeFormat)
            const new_end_date = ((isExpired)? moment(end_date,timeFormat):moment()).add((30*amount),'day').format(timeFormat)

            await pos_subscription.merge({ 
                end_date: new_end_date,
                package_id: package_id
            })
            await pos_subscription.save()
        }
    },
    RefNo:{
        GET: {
            async refno(product_name) {
                var refno = await Database
                    .table('payments')
                    .where('productdetail','LIKE',`%${product_name}%`)
                    .getCount()

                return `0${Utility.RefNo.DEFAULT[product_name.toUpperCase()]+(refno+1)}`
            },
            otp_ref(length) {
                var result = [];
                var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                for ( var i = 0; i < length; i++ ) {
                    result.push(characters.charAt(Math.floor(Math.random() * characters.length)));
                }
                return result.join('');
            },
        },
        DEFAULT: {
            Bundle: 110000000,
            BUNDLE: 110000000,
            POS: 200000000,
            MATCH: 0,
            Match: 0
        }
    },
    SMS: {
        async send_otp(phone_number, expire_minute) {
            const otpInstance = await Utility.OTP.create_otp_token(phone_number,expire_minute)
            const sent = await Twilio.messages
                .create({
                    body: `OTP เพื่อเข้าระบบ Matchday คือ:${otpInstance.otp_code} อย่าเปิดเผยรหัสนี้แก่บุคคลอื่น (Ref:${otpInstance.ref})`,
                    from: Env.get('TWILIO_FROM_NUMBER'),
                    to: phone_number
                })
            console.log({ phone: sent.to, ref: otpInstance.ref });
            return { phone: sent.to, ref: otpInstance.ref }
        }
    },
    OTP: {
        async create_otp_token(phone_number, expire) {
            try {
                const expire_time = moment().add(expire,'minute').format(timeFormat)
                var otpInstance = await OTP_Token.create({
                    phone_number: phone_number,
                    otp_code: Utility.Code_Generator.code_shuffler(6),
                    ref: Utility.RefNo.GET.otp_ref(5),
                    expire: expire? expire_time:null
                })
                
            } catch (err) {
                console.log(err);
            }

            return otpInstance
        },
        async verify_otp(otp_code, ref) {
            const error = {
                verification: false,
                remaining_time: 'expired'
            }
            try {
                var result = await OTP_Token
                    .query()
                    .where('ref',ref)
                    .where('expire','>',moment().format(timeFormat))
                    .last()

                if (result) {
                    await result.merge({ verify: true })
                    await result.save()

                    return (result.otp_code == otp_code)? {
                        verification: true,
                        remaining_time: `${moment(result.expire,timeFormat).diff(moment(),'second')} seconds`
                    }:error
                } else {
                    return error
                }
            } catch (err) {
                console.log(err);
                return false
            }
        }
    },
    Notification:   {
        async notificationSender({matches, user, type},provider_id){
            try {
                const uuids = await Utility.Notification.getUserUUID(provider_id)
                var headers = {
                    "Content-Type": "application/json; charset=utf-8"
                };

                var options = {
                    host: "onesignal.com",
                    port: 443,
                    path: "/api/v1/notifications",
                    method: "POST",
                    headers: headers
                };
            
                for(let i =0;i<matches.length;i++){
                    const day = moment(matches[i].time_start).format('DD/MM/YYYY')
                    const time_start = moment(matches[i].time_start).subtract(1,'minutes').format('HH:mm')
                    const time_end = moment(matches[i].time_end).format('HH:mm')
                    const match_id = matches[i].id

                    //https://documentation.onesignal.com/reference/create-notification
                    var heading_toppic

                    if(type == 'CancelMatch'){
                        heading_toppic = 'ยกเลิกการจอง'
                    }else if(type == 'UpdateMatch'){
                        heading_toppic = 'แก้ไขการจอง'
                    }else if(type == 'CreateMatch'){
                        heading_toppic = 'มีการจองใหม่'
                    }else {
                        heading_toppic = ''
                    }

                    const data = { 
                        app_id: OneSignal_APP_ID,
                        headings: {en: `${heading_toppic} ${day} ${time_start}-${time_end}`},
                        contents: {en: `${user.fullname} ${user.phone_number} รหัสการจอง: ${match_id}`},
                        include_player_ids: uuids,
                        small_icon: "mipmap/ic_launcher",
                        data: {match: matches[i]}
                    };
                           
                var https = require('https');
                var req = https.request(options, function(res) {  
                    res.on('data', function(data) {
                        console.log("Response:");
                        console.log(data);
                    });
                });
              
                    req.on('error', function(e) {
                        console.log("ERROR:");
                        console.log(e);
                    });
              
                    req.write(JSON.stringify(data));
                    req.end();
                }
            } catch (error) {
                console.log(err);
            }
        },
       async getUserUUID(provider_id){
            const uuid = await UserUUID
                        .query()
                        .where('user_id', provider_id)
                        .where('is_provider', 1)
                        .where('is_login', 1)
                        .select(['uuid'])
                        .fetch()
            return uuid.toJSON().map(e=>e.uuid)
        },
        async notificationToApp({matches, type},user){
             try {
                 const uuids = await Utility.Notification.getUserAppUUID({user_id: user.id})
                 var headers = {
                     "Content-Type": "application/json; charset=utf-8"
                 };
 
                 var options = {
                     host: "onesignal.com",
                     port: 443,
                     path: "/api/v1/notifications",
                     method: "POST",
                     headers: headers
                 };
             
                 for(let i =0;i<matches.length;i++){
                     const day = moment(matches[i].time_start).format('DD/MM/YYYY')
                     const time_start = moment(matches[i].time_start).subtract(1,'minutes').format('HH:mm')
                     const time_end = moment(matches[i].time_end).format('HH:mm')
                     const match_id = matches[i].id
 
                     //https://documentation.onesignal.com/reference/create-notification
                     var heading_toppic
 
                     if(type == 'UrgentUpdate'){
                            heading_toppic = FieldsLocale.translateMatchType(user.lang, 'urgent_update_type')
                     }else {
                         heading_toppic = ''
                     }
 
                    const data = { 
                        app_id: OneSignal_APP_ID,
                        headings: {
                            th: `${heading_toppic} ${day} ${time_start}-${time_end}`,
                            en: `${heading_toppic} ${day} ${time_start}-${time_end}`
                        },
                        contents: {
                            th: `${user.fullname} ${user.phone_number} รหัสการจอง: ${match_id}`,
                            en: `${user.fullname} ${user.phone_number} ID: ${match_id}`},
                        include_player_ids: uuids,
                        small_icon: "mipmap/ic_launcher",
                        data: {match: matches[i]}
                    };
                            
                 var https = require('https');
                 var req = https.request(options);
               
                     req.on('error', function(e) {
                         console.log("ERROR:");
                         console.log(e);
                     });
               
                     req.write(JSON.stringify(data));
                     req.end();
                 }
             } catch (error) {
                 console.log(error);
             }
         },
        async getUserAppUUID({user_id, provider_id}){
                const uuid = await UserUUID
                            .query()
                            .where(function(){
                                if(user_id){
                                    this.where('user_id', user_id)
                                    this.where('is_provider', 0)
                                }
                                if(provider_id){
                                    this.where('user_id', provider_id)
                                    this.where('is_provider', 1)
                                }
                            })
                            .where('is_login', 1)
                            .select(['uuid'])
                            .fetch()
                return uuid.toJSON().map(e=>e.uuid)
         },

     }
    
}

module.exports = Utility
'use strict'

const moment = use('moment')
const timeFormat = 'YYYY-MM-DD HH:mm:ss'

const UserUuid = use('App/Models/UserUuid')
const Provider = use('App/Models/Provider')
const Court = use('App/Models/Court')
const CourtType = use('App/Models/CourtType')
const Match = use('App/Models/Match')
const AccessLevelSetting = use('App/Models/AccessLevelSetting')
const Helper = require('../Helper.js')
const { Validator, Checker, Mutator } = require('../Utility.js')
const SumDailyRevenue = require('../SumDailyRevenue.js')
const Utility = require('../Utility.js')

const LogTcPrivacy = use('App/Models/LogTcprivacy')
const TcPrivacyVersion = use('App/Models/TcprivacyVersion')
class ArenaController {

    async getProfile({ request, response, auth }) {
        let now = moment().toDate()
        const profile = await auth.getUser()

        const { sub, data } = auth.jwtPayload
        var lang;
        if (data) {
            lang = data.lang
        }
        const role  = data ? data.level : 4 

        const provider = await Provider
            .query()
            .where('id',profile.id)
            .with('provider_sports', (bd) => {
                bd.with('sport')
                bd.with('court_types',(ct) => {
                    ct.with('courts')
                    ct.with('time_slots.slot_prices')
                    ct.with('period_price')
                    ct.with('fixed_times')
                })
                bd.with('bus_times')
            })
            .with('bus_times')
            .with('packages',(pk)=>{
                pk.where('expire_date' ,'>=' ,now )
                pk.with('package')
            })
            .with('inventories',(i)=>{
                i.where('remove', 0)
                .with('inventory_histories')
                .with('used_inventory',(u)=>{
                    u.with('match')
                })
            })
            .with('services')
            .with('stocks')
            .with('option_prices')
            .with('pos_subscription.package.pos_settings')
            .select([
                'id',
                'phone_number',
                'email',
                'logo',
                'location',
                'minTime',
                'maxTime',
                'online_pay',
                'deposit_pay',
                'fullname',
                'policy',
                'tc',
                'lang'
                ])
            .fetch()

        const access = await AccessLevelSetting.query().where('levels','like','%'+role+'%').fetch()

        var result = provider.toJSON().map(p=>{
            p.inventories = Utility.Mutator.getInventoriesRemaining(p.inventories)
            p.access_level_settings = access.toJSON()
            if (lang) p.lang = lang
            return p
        })
        result[0] = await Utility.FindOrCreate.provider_pos_subscription(result[0])
        return response.send(result[0])
    }

    async updateProfile({ request, response, auth }) {
        try {
            const sp = await auth.getUser()
            await sp.merge(request.body)
            await sp.save()
            
            return response.send({ status: 'success', updated: sp})
        } catch (err) {
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }
    
    async getFreeCourts({ response, request }) {
        var {court_type_id, courts, time_start, time_end, duration_type } = request.body
        time_start = Validator.matchTimeInput(time_start, time_end)
        time_end = Validator.checkDay_timeEnd(time_start, time_end)

        try {
            if (court_type_id) {
                    const freeCourts = await CourtType
                                        .query()
                                        .where('id', court_type_id)
                                        .with('period_price')
                                        .with('fixed_times')
                                        .with('time_slots.slot_prices')
                                        .with('share_courts',(c)=>{
                                            c.whereDoesntHave('matches', (match) => {
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
                                        .fetch()

                    var court_prices = freeCourts.toJSON().filter((f)=> f.share_courts.length > 1)
        
                    const output = {
                        free: court_prices.map(court_type => {
                        court_type.duration = Helper.getDuration({ time_start, time_end },duration_type? duration_type:'hours')
                        court_type.price = Helper.cal_PeriodPrice({ 
                            period_prices: court_type.period_price,
                            time_start,
                            time_end,
                            price_court: court_type.price,
                            time_slots: court_type.time_slots,
                            free_hour: court_type.free_hour
                        })
                        if(!court_type.free_hour) court_type.price = court_type.price / court_type.duration
                        delete court_type.period_price
                        delete court_type.time_slots

                        return court_type
                        })
                    }
                    return response.send(output)
            } else {
                    const freeCourts = await Court
                        .query()
                        .whereIn('id',courts)
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
                        .with('court_type',(ct) => {
                            ct.with('period_price')
                            ct.with('fixed_times')
                            ct.with('time_slots.slot_prices')
                        })
                        .fetch()
        
                var court_prices = freeCourts.toJSON()
                const output = {
                    free: court_prices.map(court => {
                        
                        court.duration = Helper.getDuration({ time_start, time_end },duration_type? duration_type:'hours')
                        court.price = Helper.cal_PeriodPrice({ 
                            period_prices: court.court_type.period_price,
                            time_start,
                            time_end,
                            price_court: court.price,
                            time_slots: court.court_type.time_slots,
                            free_hour: court.court_type.free_hour
                        })
                        
                        delete court.court_type.period_price
                        delete court.court_type.time_slots
                        delete court.court_type.price

                        return court
                    })
                }

                return response.send(output)
            }
           
        } catch (error) {
            console.log(error)
            return response.send(error)
        }
    }

    async getFreeCourtsFromTypes({ response, request }) {
        return response.send(await Checker.checkCourtType(request.body))
    }
    
    async checkMatchToEdit ({ response, request, params }) {
        var { court, time_start, time_end } = request.body
        time_start = Validator.matchTimeInput(time_start, time_end)
        time_end = Validator.checkDay_timeEnd(time_start, time_end)

        const match = await Match
                        .query()
                        .where('id',params.id)
                        .select(['time_start','time_end'])
                        .fetch()

        const matchStart = match.toJSON()[0].time_start
        const matchEnd = match.toJSON()[0].time_end

        // if (Validator.detectMatchTime([matchStart, matchEnd], time_end)) {
        //     time_start = Mutator.matchTimeSwitch({ time_start: matchStart, time_end: matchEnd } ,{ time_start, time_end }, 'time_start')
        //     time_end = Mutator.matchTimeSwitch({ time_start: matchStart, time_end: matchEnd } ,{ time_start, time_end }, 'time_end')
        // }
        const freeCourts = await Court
                        .query()
                        .where('id',court)
                        .whereDoesntHave('matches', (match) => {
                            match.where('cancel',0)
                            match.whereNot('id',params.id)
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

        const output = {
            free: freeCourts
        }

        return response.send(output)
    }

    async getDailyRevenue({ request, response, auth }){
        const sp = await auth.getUser()
        var { time_start, time_end } = request.body

        const result = await SumDailyRevenue.Show.get_daily_revenue(time_start, time_end, sp, true)
        response.send(result)
    }

    async uuid ({request, response, auth}){
        try {
             const { uuid, is_login ,is_provider} = request.post()
             const user = await auth.getUser()
             const user_uuid = await UserUuid
             .query()
             .where('uuid',uuid)
             .where('user_id',user.id)
             .where(function(){
                 if(is_provider){
                     this.where('is_provider', 1)
                 }
             })
             .first()

             if(user_uuid){
                 user_uuid.is_login = is_login
                 await user_uuid.save()
                 return response.send({status: 'success',"updated" : user_uuid})
             }else{
                 let user_uuid = new UserUuid()
                 user_uuid.uuid = uuid
                 user_uuid.user_id = user.id
                 user_uuid.is_login = is_login
                 user_uuid.is_provider = is_provider
                 await user_uuid.save()
                 return response.send({status: 'success',"created" : user_uuid})
                 
             }
        }catch(err){
             console.log(err);
             return response.send({status: 'fail', error: err.toString() })
        }
    }

    async acceptTcPrivacy({request, response, auth}){
        const sp = await auth.getUser()
        try {
            const provider = await Provider.find(sp.id)
            await provider.merge({tc: 1, policy: 1})
            await provider.save()
        
            const last_version = await TcPrivacyVersion.query().last()
            const log = new LogTcPrivacy()
            log.version = last_version.version
            log.provider_id = sp.id
            await log.save()

            response.send({status: 'success', log})
        } catch (error) {
            response.send({status: 'fail', error})
        }
    }

    async updateTcPrivacy({request, response, auth}){
        const {version, updated_at} = request.body
        try {
            const result = new TcPrivacyVersion()
            result.version = version
            result.updated_at = updated_at
            await result.save()

            //reset tc & privacy
            await Provider.query().update({policy: 0, tc: 0})

            response.send({status: 'success', result})
        } catch (error) {
            response.send({status: 'fail', error})
        }
    }
}

module.exports = ArenaController

'use strict'

const Helper = require("../Helper")
const { Checker, Validator } = require("../Utility")

const Provider = use('App/Models/Provider')
const ProviderSport = use('App/Models/ProviderSport')
const Match = use('App/Models/Match')
const Court = use('App/Models/Court')
const CourtType = use('App/Models/CourtType')
const Promo = use('App/Models/Promotion')
const Room = use('App/Models/Room')
const Staff = use('App/Models/Staff')
const TypePrice = use('App/Models/CourtTypePeriodPrice')
const FixedTime = use('App/Models/CourtTypeFixedTime')
const Token = use('App/Models/Token')
const Database = use('Database')
const moment = use('moment')

class ProviderController {

    async index({ response }) {
        try {
            const provider = await Provider
                .query()
                .where('hidden_app', 0)
                .with('provider_sports', (bd) => {
                    bd.with('sport')
                    bd.with('court_types.courts')
                })
                .with('facilities')
                .with('photos')
                .with('bus_times')
                .with('ratings')
                .fetch()

            return response.send(provider)
        } catch (err) {
            return response.send({error: err.toString()})
        }
    }

    async show({ auth, response, params }) {
        const provider = await Provider
            .query()
            .where((parseInt(params.id,10) > 0 && parseInt(params.id,10).toString().length == params.id.length)? 'id':'url_nickname', params.id)
            .orWhere('fullname','like',`${params.id}%`)
            .with('provider_sports', (bd) => {
                bd.with('sport')
                bd.with('period_price')
                bd.with('services')
                bd.with('bus_times')
                bd.with('court_types',(ct) => {
                    ct.with('courts')
                    ct.with('time_slots.slot_prices')
                    ct.with('period_price')
                    ct.with('fixed_times')
                })
            })
            .with('blogs')
            
            .with('bus_times')
            .with('photos')
            .with('facilities')
            .with('ratings.user')
            .fetch()

        let result = (provider.toJSON().length > 1)? provider.toJSON().find(sp => sp.id == params.id):provider.toJSON()[0]

        try {
            const user = await auth.getUser()
            if (user) {
                let pro = await Provider.find(params.id)
                await pro.merge({ view: pro.view + 1 })
                await pro.save()
            }

            return response.send(result)
        } catch (err) {
            return response.send(result)   
        }
    }

    async login_provider({ request, response, auth }) {
        const { username, password } = request.post()
        const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

        try {
            if (reg.test(username)) {
                var token = await auth.authenticator('Arena').attempt(username, password)
                if (token) {
                    return response.send({status: 'sp', token: token, level: 'sp'})
                }
    
            } else if (username.length == 10) {
                var token = await auth.authenticator('ArenaPhone').attempt(username, password)
                if (token) {
                    return response.send({status: 'sp', token: token, level: 'sp'})
                }
            }
            const checkStaff = await auth.authenticator('Staff').attempt(username, password)
                if (checkStaff) {
                    const staff = await Staff.findBy('username',username)
                    const sp = await Provider.find(staff.toJSON().provider_id)
                    const token = await auth.authenticator('Arena').generate(sp, { lang: staff.lang, level: staff.level, id: staff.id})
    
                    return response.send({status:'staff',token: token, level: staff.level,staff: staff.toJSON()})
                }
        } catch (err) {
            console.log(err);
            return response.status(401).send({error: err.toString()})
        }
    }

    async generate_admin_token({ request, response, auth }) {
        try {
            const { password, expire_at } = request.post()
            const admin = await Provider.find(1)
            const token = await auth.generate(admin)
            const new_pass = await Token.create({ user_id: 1,token:token.token, password, expire_at })
            if (new_pass) {
                return response.send({ status: 'success', instance: new_pass})
            } else {
                return response.send({ status: 'fail'})
            }
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err})
        }
    }

    async profile_provider({ auth, response }) {
        const check = await auth.getUser()
        let now = moment().toDate()
        const provider = await Provider
            .query()
            .where('id', check.id)
            .with('provider_sports', (bd) => {
                bd.with('sport')
                bd.with('bus_times')
                bd.with('services')
                // bd.with('period_price')
                bd.with('court_types', (ct) => {
                    ct.with('period_price')
                    ct.with('fixed_times')
                    ct.with('courts')
                })
                
            })
            .with('facilities')
            .with('blogs')
            .with('packages',(pk)=>{
                pk.where('expire_date' ,'>=' ,now )
                pk.with('package')
            })
            .with('ratings')
            .with('users')
            .fetch()

        let result = provider.toJSON()[0]

        return response.send(result)
    }

    async update({ request, response, auth }) {
        const pid = await auth.getUser()
        const body = request.post()
        const pitch = await Provider.find(pid.id)

        await pitch.merge(body)
        await pitch.save()

        return response.send({ "updated": pitch })
    }

    async editMatch({ response, request, params }) {
        const match = await Match.find(params.id)
        const body = request.body

        try {
            await match.merge(body)
            await match.save()

            return response.send({ status: 'success', updated: match.id })
        } catch (err) {
            return response.send({ status: 'fail', error: err })
        }
    }

    async myMatches({ request, response, auth, params }) {
        const pid = await auth.getUser()
        const pitch = await Provider.find(pid.id)
        let matches = await pitch
            .court_types()
            .with('matches', (bd) => {
                bd.where('cancel', 0)
                bd.with('user')
                bd.with('court')
                bd.with('stack')
                bd.with('rooms')
            })
            .fetch()

        let result = matches.toJSON()

        return response.send(result)
    }

    async spMatches({ request, response, params }) {
        var { time_start,time_end } = request.body
        time_start = Validator.matchTimeInput(time_start, time_end)

        let matches = await ProviderSport
                    .query()
                    .where('provider_id',params.sp)
                    .with('bus_times')
                    .with('sport')
                    .with('courts',(c)=> {
                        c.with('court_type')
                        c.with('matches', (bd) => {
                            bd.where('cancel', 0)
                            bd.whereBetween('time_end', [time_start, time_end])
                            bd.with('user')
                            bd.with('payments')
                        })
                    })
                    .fetch()

        let result = matches.toJSON().map(match => {
            if (match.user) {
                delete match.user.password
            }
            return match
        })

        return response.send(result)
    }

    async myStacks({ auth, response }) {
        const check = await auth.getUser()
        const sp = await Provider
            .query()
            .where('id', check.id)
            .with('stacks', (mt) => {
                mt.where('cancel', 0)
                mt.with('matches')
            })
            .fetch()

        let result = sp.toJSON()[0].stacks

        return response.send(result)
    }

    async myMembers({ response, request, auth }) {
        const sp = await auth.getUser()
        const mem = await Provider
            .query()
            .where('id', sp.id)
            .with('users', (mm) => {
                mm.with('matches', (mat) => {
                    mat.where('cancel', 0)
                    mat.whereHas('court', (mt) => {
                        mt.whereHas('court_type', (ct) => {
                            ct.whereHas('provider_sport', (cs) => {
                                cs.whereHas('provider', (pr) => {
                                    pr.where('id', sp.id)
                                })
                            })
                        })
                    })
                })
            })

            .fetch()
        var users = mem.toJSON()[0].users

        users = users.map(user => {
            user.matches.map(match => {
                
                var tend = moment(match.time_end,'YYYY-MM-DD HH:mm:ss')
                var tstart = moment(match.time_start,'YYYY-MM-DD HH:mm:ss')               
                var time = tend.diff(tstart, 'minutes') // 1
                var unixTN = tend.unix();
                var unixTS = tstart.unix();

                if(unixTN<unixTS) {tend.subtract(1,'seconds').add(1,'day') ; tstart.subtract(1,'seconds');} 
                            
                 time = tend.diff(tstart,'minutes')
                
                              
                match.count_time = time
                return  match
                
                
            })
                
                return user               
        })

      
      

        return response.send(users)
    }

    async myPromotions({ response, auth }) {
        try {
            const sp = await auth.getUser()
            const promos = await Promo
                .query()
                .where('provider_id', sp.id)
                .where('deleted', 0)
                .fetch()


            return response.send(promos)
        } catch (err) {
            return response.send({ status: 'fail', error: err })
        }
    }

    async createPromotion({ response, request, auth }) {
        const sp = await auth.getUser()
        const {
            name,
            type,
            value,
            expire_start,
            expire_end,
            total_use,
            user_limit
        } = request.body

        try {
            let pro = new Promo()
            pro.provider_id = sp.id
            pro.name = name
            pro.type = type
            pro.value = value
            pro.expire_start = expire_start
            pro.expire_end = expire_end
            pro.total_use = total_use
            pro.user_limit = user_limit

            await pro.save()
            return response.send({ status: 'success', pro })
        } catch (err) {
            return response.send({ status: 'fail', err })
        }
    }

    async editPromotion({ response, request, params }) {
        const pro = await Promo.find(params.id)
        const body = request.body
        try {
            await pro.merge(body)
            await pro.save()

            return response.send({ status: 'success', updated: pro.id })
        } catch (err) {
            return response.send({ status: 'fail', error: err })
        }
    }

    async freeCourt({ response, request, params }) {
        const provider = await getProvider(params.id)
        let { time_start, time_end } = request.body
        time_start = Validator.matchTimeInput(time_start, time_end)
        let day = moment(time_start, 'YYYY-MM-DD HH:mm').format('e')

        let com_start = moment(time_start, 'YYYY-MM-DD HH:mm').unix()
        let com_end = moment(time_end, 'YYYY-MM-DD HH:mm').unix()
        if (com_start > com_end) {
            time_end = moment(time_end, 'YYYY-MM-DD HH:mm').add(1, 'days').format('YYYY-MM-DD HH:mm')
        }//check TimeEnd Day

        if (provider.available == 1) {
            let pas_start = moment(time_start, 'YYYY-MM-DD HH:mm').add(1, 'minutes').format('YYYY-MM-DD HH:mm')

            if (parseInt(provider.maxTime, 10) > 23) {
                provider.maxTime = `${parseInt(provider.maxTime, 10) - 24}:00`
            }

            let pas_end =
                moment(`
                    ${moment(time_end, 'YYYY-MM-DD HH:mm').startOf('day').format('YYYY-MM-DD')} 
                    ${provider.maxTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm')

            let checkMin = moment(pas_start, 'YYYY-MM-DD HH:mm').format('HH:mm')
            let checkMax = moment(pas_end, 'YYYY-MM-DD HH:mm').format('HH:mm')
            if (parseInt(checkMax, 10) < parseInt(checkMin, 10)) {
                pas_end = moment(pas_end, 'YYYY-MM-DD HH:mm').add(1, 'days').format('YYYY-MM-DD HH:mm')
            }

            if (parseInt(checkMin, 10) < 4) {
                day = day - 1
                if (day < 0) {
                    day = 6
                }
            }

            const checkCourtStart = await provider
                .provider_sports()
                .with('sport')
                .with('court_types', (bd) => {
                    bd.with('courts', (sp) => {
                        sp.whereHas('matches', (mt) => {
                            mt.where('cancel', 0)
                            mt.where(function() {
                                this.whereBetween('time_start', [pas_start, time_end])
                                this.orWhereBetween('time_end', [pas_start, time_end])
                            })
                        })
                    })
                })
                .fetch()

            let booked_courts = []
            checkCourtStart.toJSON().map(item => {
                item.court_types.map(type => {
                    type.courts.map(court => {
                        if (court != null) {
                            booked_courts.push(court.id)
                        }
                    })
                })
            })

            let res = Array.from(new Set(booked_courts))
            //Remove duplicate

            const getFreeCourt = await provider
                .provider_sports()
                .with('sport')
                .with('court_types', (bd) => {
                    bd.whereHas('courts', (sp) => {
                        sp.whereNotIn('id', res)
                    })
                    bd.with('courts', (sp) => {
                        sp.whereNotIn('id', res)
                    })
                })
                .fetch()

            let freeCourts = []
            getFreeCourt.toJSON().map(item => {
                item.court_types.map(type => {
                    type.courts.map(court => {
                        freeCourts.push(court.id)
                    })
                })
            })

            //Check if it is really free
            const checkToEnd = await provider
                .provider_sports()
                .with('services')
                // .with('period_price')
                .with('bus_times')
                .with('sport')
                .with('court_types', (bd) => {
                    bd.with('period_price')
                    bd.with('courts', (sp) => {
                        sp.whereIn('id', freeCourts)
                        sp.whereDoesntHave('matches', (mt) => {
                            mt.where('cancel', 0)
                            mt.whereBetween('time_end', [time_end, pas_end])
                            mt.where('time_start', '<', time_end)
                        })
                    })
                })
                .fetch()

            const output = {
                free: checkToEnd,
                sports: checkTime(checkToEnd)
            }

            return response.send(output)
        } else {
            const checkToEnd = await provider
                .provider_sports()
                .with('services')
                .with('bus_times')
                // .with('period_price')
                .with('sport')
                .with('court_types', (bd) => {
                    bd.with('courts', (sp) => {
                        sp.whereIn('id', [0])
                    })
                })
                .fetch()

            const output = {
                free: checkToEnd,
                sports: checkTime(checkToEnd)
            }

            return response.send(output)
        }

        function checkTime(array) {
            let pass = array.toJSON()
            let time = pass.map(sport => {
                let filtered = sport.bus_times.filter(slot => {
                    slot.days = slot.days.split(',').map(n => parseInt(n, 10))
                    let today = slot.days.findIndex((t) => t == day)
                    if (today != -1) {
                        if (parseInt(slot.close_time, 10) > 23) {
                            slot.close_time = `${parseInt(slot.close_time, 10) - 24}:00`
                        }
                        return slot
                    }
                })

                return filtered[0]
            }).filter(p => p != null)

            let status = time.map(bus => {
                try {
                    let check_start = moment(time_start, 'YYYY-MM-DD HH:mm').unix()
                    let check_end = moment(time_end, 'YYYY-MM-DD HH:mm').unix()
                    let open = moment(`${moment(time_start, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD')} ${bus.open_time}`, 'YYYY-MM-DD HH:mm').unix()
                    let close = moment(`${moment(time_start, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD')} ${bus.close_time}`, 'YYYY-MM-DD HH:mm').unix()

                    let dayStart = moment(time_start, 'YYYY-MM-DD HH:mm').format('HH:mm')
                    let dayClose = moment(close, 'X').format('HH:mm')
                    if (parseInt(dayStart, 10) < 6 && parseInt(dayClose, 10) < 4) {
                        open = moment(open, 'X').subtract(1, 'days').unix()
                    }
                    if (close < open) {
                        close = moment(close, 'X').add(1, 'days').unix()
                    }


                    if ((check_end > open && check_end <= close) && (check_start >= open && check_start < close)) {
                        bus.status = true
                    } else {
                        bus.status = false
                    }

                } catch (err) {
                    console.log(err);
                }

                return bus
            })

            return status
        }
    }

    async getCheapestProviderCourtType({response, request}) {
        let result = []
        let { provider_court_types } = request.body

        if(provider_court_types === undefined || provider_court_types == null) {
            return response.send([])
        }

        for(let i = 0; i < provider_court_types.length; i++) {
            let { provider_id, court_types_ids, time_start, time_end } = provider_court_types[i]
            
            const freeCourts = await getFreeCourt(provider_id, court_types_ids, time_start, time_end)
            let providerCheapestPriceCourtType = []

            if(freeCourts === undefined || freeCourts == null) {
                return
            }

            if(freeCourts.free === undefined || freeCourts.free == null) {
                return
            }

            for(let k = 0; k < freeCourts.free.length; k++) {
                let minPrice = await findMinPriceCourts(freeCourts.free[k].courts.toJSON())
                providerCheapestPriceCourtType.push(minPrice)
            }
            
            result.push({
                provider_id: provider_id,
                cheapest_price_court_type: providerCheapestPriceCourtType
            })
        }
        return response.send(result)
    }

    async getFreeCourt({ response, request }) {
        let { provider_id, court_types_ids, time_start, time_end } = request.body

        const freeCourts = await getFreeCourt(provider_id, court_types_ids, time_start, time_end)
        return response.send(freeCourts)
    }

    async freeAsapCourt({ response, request, params }) {
        const provider = await Provider.find(params.id)
        const type = await CourtType.find(params.type)
        await type.load('provider_sport.bus_times')

        let { time_start, time_end } = request.body
        let today = moment(time_start, 'YYYY-MM-DD HH:mm').format('e')
        const bus_times = type.toJSON().provider_sport.bus_times.filter(time => {
            let dayToArray = time.days.split(',')
            let days = dayToArray.map((n) => parseInt(n, 10))
            return time.days[days.findIndex(m => m == today)]
        })[0]

        let com_start = moment(time_start, 'YYYY-MM-DD HH:mm').unix()
        let com_end = moment(time_end, 'YYYY-MM-DD HH:mm').unix()
        if (com_start > com_end) {
            time_end = moment(time_end, 'YYYY-MM-DD HH:mm').add(1, 'days').format('YYYY-MM-DD HH:mm')
        }//check TimeEnd Day

        let closed =
            moment(`${moment(time_start, 'YYYY-MM-DD HH:mm').startOf('day').format('YYYY-MM-DD')} 
                ${bus_times.close_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm')

        if (parseInt(bus_times.close_time, 10) > 23) {
            bus_times.close_time = `${parseInt(bus_times.close_time, 10) - 24}:00`
            closed = moment(`${moment(time_start, 'YYYY-MM-DD HH:mm').add(1, 'days').format('YYYY-MM-DD')} 
                ${bus_times.close_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm')
        }

        if (provider.available == 1) {

            //Check Booked Court
            let court_id = []
            const courtEnd_id = await type
                .courts()
                .with('matches', (mt) => {
                    mt.where('cancel', 0)
                    mt.whereBetween('time_end', [time_start, time_end])
                })
                .fetch()
            courtEnd_id.toJSON().map(court => court_id.push(court.id))

            const addedStart = moment(time_start, 'YYYY-MM-DD HH:mm').add(1, 'minutes').format('HH:mm')
            const courtStart_id = await type
                .courts()
                .with('matches', (mt) => {
                    mt.where('cancel', 0)
                    mt.whereBetween('time_start', [addedStart, time_end])
                })
                .fetch()
            courtStart_id.toJSON().map(court => court_id.push(court.id))

            const getCourtDay = await type
                .courts()
                .with('matches', (mt) => {
                    mt.where('cancel', 0)
                    mt.whereBetween('time_end', [time_start, closed])
                })
                .fetch()

            let res = Array.from(new Set(court_id))

            const getCourtHour = await type
                .courts()
                .whereNotIn('id', res)
                .fetch()

            let courtsHour = getCourtHour.toJSON()
            let courtsDay = getCourtDay.toJSON()

            let cutted = []
            var i; //Check Free courts
            for (i = 0; i < courtsHour.length; i++) {
                if (courtsHour[i].matches.length < 1) {
                    cutted.push(courtsHour[i])
                    break
                }
            }

            if (cutted.length < 1) {
                let result = []
                courtsDay.filter(court => {
                    const matches = court.matches

                    var f;
                    for (f = 0; f < matches.length; f++) {
                        try {
                            let a = moment(matches[f].time_end, 'YYYY-MM-DD HH:mm:ss')
                            let b = []
                            let c = moment(closed, 'YYYY-MM-DD HH:mm')

                            if (f + 1 < matches.length) {
                                b.push(moment(matches[f + 1].time_end, 'YYYY-MM-DD HH:mm:ss'))
                            }
                            if (b.length > 0) {
                                if (b[f].diff(a, 'minutes') > 59) {
                                    result.push(matches[f].time_end)
                                    break;
                                }
                            } else {
                                if (c.diff(a, 'minutes') > 59) {
                                    result.push(matches[f].time_end)
                                    break;
                                }
                            }
                        } catch (err) {

                        }
                    }
                })
                let sorted = result.sort((a, b) => (moment(a).unix() < moment(b).unix()) ? -1 : 1)
                let got = moment(sorted[0], 'YYYY-MM-DD HH:mm:ss').format('HH:mm')

                return response.send({ court_type_id: params.type, time: got })
            } else {
                return response.send({ court_type_id: params.type, time: 'ยังว่างอยู่' })
            }

        } else {
            return response.send({ time: 'ตามประกาศ', status: 'out of service' })
        }
    }

    async allFreeSlot({ response, params, request }) {
        const provider = await Provider.find(params.id)
        const court_type = await CourtType.find(params.type)
        await court_type.load('provider_sport.bus_times')

        const { time_start } = request.body
        let comStart = moment(time_start, 'YYYY-MM-DD HH:mm').format('HH:mm')

        if (provider.available == 1) {

            let day = moment(time_start, 'YYYY-MM-DD HH:mm').startOf('day').format('e')
            if (parseInt(comStart, 10) < parseInt(provider.minTime, 10)) {
                day = day - 1
                if (day < 0) {
                    day = 6
                }
            }
            const bus_times = court_type.toJSON().provider_sport.bus_times.filter(time => {
                let dayToArray = time.days.split(',')
                let days = dayToArray.map((n) => parseInt(n, 10))
                return time.days[days.findIndex(m => m == day)]
            })[0]

            var daystart;
            var dayend;

            if (bus_times) {
                let today = moment(time_start, 'YYYY-MM-DD HH:mm').startOf('day').format('YYYY-MM-DD HH:mm')
                if (parseInt(comStart, 10) < parseInt(provider.minTime,10)) {
                    today = moment(time_start, 'YYYY-MM-DD HH:mm').subtract(1, 'days').startOf('day').format('YYYY-MM-DD HH:mm')
                }

                //DayStart
                daystart = moment(`
                ${moment(today, 'YYYY-MM-DD HH:mm').startOf('day').format('YYYY-MM-DD')} 
                ${bus_times.open_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss')

                //Close Time
                dayend = moment(`
                    ${moment(today, 'YYYY-MM-DD HH:mm').startOf('day').format('YYYY-MM-DD')} 
                    ${bus_times.close_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss')

                if (parseInt(bus_times.close_time, 10) > 23) {//Alter Close Time
                    bus_times.close_time = `${parseInt(bus_times.close_time, 10) - 24}:00`
                    dayend = moment(`
                    ${moment(today, 'YYYY-MM-DD HH:mm').add(1, 'days').add(1,'minutes').format('YYYY-MM-DD')} 
                    ${bus_times.close_time}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm:ss')
                }
            } else {
                daystart = moment(time_start, Helper.timeFormat).startOf('days').format(Helper.timeFormat)
                dayend = moment(daystart,Helper.timeFormat).add(1,'days').format(Helper.timeFormat)
            }            

            //Check Booked Court
            const getType = await court_type
                .courts()
                .with('matches', (m) => {
                    m.where('cancel', 0)
                    m.where(function() {
                        this.whereBetween('time_start', [daystart, dayend])
                        this.orWhereBetween('time_end', [daystart, dayend])
                        this.orWhere(function () {
                            this.where('time_start', '<=', daystart)
                            this.where('time_start', '<=', dayend)
                            this.where('time_end', '>=', daystart)
                            this.where('time_end', '>=', dayend)
                        })
                    })
                })
                .fetch()

            let pasType = getType.toJSON()
            let slot = []

            pasType.forEach(court => {

                try {
                    if (court.matches.length > 0) {
                        court.matches = court.matches.sort((a, b) =>
                            (moment(a.time_start, 'YYYY-MM-DD HH:mm:ss').unix() > moment(b.time_start, 'YYYY-MM-DD HH:mm:ss').unix()) ? 1 : -1)

                        for (let i = 0; i < court.matches.length; i++) {

                            if (i < court.matches.length && court.matches.length > 1) {

                                let open = moment(daystart, 'YYYY-MM-DD HH:mm')
                                let close = moment(closed, 'YYYY-MM-DD HH:mm')

                                let a_start = moment(court.matches[0].time_start, 'YYYY-MM-DD HH:mm:ss').subtract(1, 'minutes')
                                let b_last = moment(court.matches[court.matches.length - 1].time_end, 'YYYY-MM-DD HH:mm:ss')

                                let a = moment(court.matches[i].time_end, 'YYYY-MM-DD HH:mm:ss')
                                var b;
                                if (court.matches[i + 1]) {
                                    b = moment(court.matches[i + 1].time_start, 'YYYY-MM-DD HH:mm:ss').subtract(1, 'minutes')
                                }

                                if (a_start.diff(open, 'minutes') > 59) {
                                    slot.push(`${open.format('HH:mm')}-${a_start.format('HH:mm')}`)
                                }

                                if (b.diff(a, 'minutes') > 59) {
                                    slot.push(`${a.format('HH:mm')}-${b.format('HH:mm')}`)
                                }

                                if (close.diff(b_last, 'minutes') > 59) {
                                    slot.push(`${b_last.format('HH:mm')}-${close.format('HH:mm')}`)
                                }

                            } else {
                                
                            }
                        }

                    } else {

                        if (court.matches.length == 0) {

                            let open = moment(daystart, 'YYYY-MM-DD HH:mm')
                            let close = moment(closed, 'YYYY-MM-DD HH:mm')

                            slot.push(`${open.format('HH:mm')}-${close.format('HH:mm')}`)

                        } else {

                            let open = moment(daystart, 'YYYY-MM-DD HH:mm')
                            let close = moment(closed, 'YYYY-MM-DD HH:mm')

                            let a = moment(court.matches[0].time_start, 'YYYY-MM-DD HH:mm:ss').subtract(1, 'minutes')
                            let b = moment(court.matches[0].time_end, 'YYYY-MM-DD HH:mm:ss')

                            if (court.matches.length == 1) {

                                if (a.diff(open, 'minutes') > 59) {
                                    slot.push(`${open.format('HH:mm')}-${a.format('HH:mm')}`)
                                }

                                if (close.diff(b, 'minutes') > 59) {
                                    slot.push(`${b.format('HH:mm')}-${close.format('HH:mm')}`)
                                }

                            }
                        }

                    }
                } catch (err) {

                }
            });

            let uniq = [...new Set(slot)].sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            for (let s = 0; s < uniq.length; s++) {
                if (parseInt(uniq[0], 10) < 6) {
                    uniq.push(uniq.shift())
                }
            }

            for (let t = 0; t < uniq.length + 1; t++) {
                mergeTime(uniq)
            }

            return response.send(uniq)

        } else {
            return response.send(['สนามไม่เปิดบริการ'])
        }
    }

    async createMatch({ response, request, auth, params }) {
        const {
            service_id,
            time_start,
            time_end,
            description,
            total_price,
            room_switch }
            = request.body

        let match = new Match()
        match.user_id = null
        match.room_switch = room_switch
        match.service_id = service_id
        match.court_id = params.id
        match.time_start = time_start
        match.time_end = time_end
        match.description = description
        match.total_price = total_price

        if (await Checker.checkCourt(params.id, Validator.matchTimeInput(time_start), time_end)) {
            await match.save()
            return response.send({
                status: 'Success - Match Created',
                match_id: match.id
            })
        } else {
            return response.send({
                status: 'Fail - Court Booked',
                Match: res
            })
        }
    }

    async deleteMatch({ response, request, auth, params }) {
        const match = await Match.find(params.id)
        const pid = await auth.getUser()
        await match.load('court.court_type.provider_sport.provider')

        let res = match.toJSON()
        if (res.court.court_type.provider_sport.provider.id == pid.id) {
            await match.delete()
            return response.send('== Match Deleted ==')
        } else {
            return response.send('== Not Authorized ==')
        }
    }

    async manageMatch({ response, request, params }) {

        function checkBody(body, match) {

            if (body.court_id) {
                return body.court_id
            } else {
                return match.court_id
            }
        }

        const match = await Match.find(params.id)
        const court = await Court.find(checkBody(request.body, match.toJSON()))
        await match.merge(request.body)

        let courts = []
        const checkCourtStart = await court
            .matches()
            .where('cancel', 0)
            .whereBetween('time_start', [request.body.time_start, request.body.time_end])
            .with('court.court_type.provider_sport.provider')
            .with('user')
            .fetch()
        courts.push(checkCourtStart.toJSON()[0])

        const checkCourtEnd = await court
            .matches()
            .where('cancel', 0)
            .whereBetween('time_end', [request.body.time_start, request.body.time_end])
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
            )
        } catch (err) { }

        var i;
        for (i = 0; i < courts.length; i++) {
            if (courts[i] !== undefined) {
                res.push(courts[i])
            }
        }

        if (res.length < 1 || (res.length == 1 && res[0].id == match.id)) {
            try {
                await match.save()
                return response.send({ status: 'Success', match })
            } catch (err) {
                return response.send({ status: 'Fail', error: err })
            }
        } else {
            return response.send({ status: 'Fail', error: 'Court Booked' })
        }
    }

    async myGroupSession({ response, request, auth }) {
        const pid = await auth.getUser()
        const pitch = await Provider.find(pid.id)
        let matches = await pitch
            .court_types()
            .whereHas('matches', (bd) => {
                bd.where('cancel', 0)
                bd.where('room_switch', 1)
            })
            .with('matches', (bd) => {
                bd.where('cancel', 0)
                bd.where('room_switch', 1)
                bd.with('rooms', (us) => {
                    us.where('accept', 1)
                    us.with('user')
                })
                bd.with('court')
                bd.with('stack')
            })
            .fetch()

        return response.send(matches)
    }

    async addPlayer({ response, request, params }) {
        const gs = await Match.find(params.id)
        const { client } = request.body

        if (client) {
            try {
                let room = new Room()
                room.match_id = gs.id
                room.accept = 1
                room.description = client
                await room.save()

                return response.send({ status: 'success', created: room.id })
            } catch (err) {
                console.log(err);
                return response.send({ status: 'fail', error: err })
            }
        } else {
            return response.send({ status: 'fail', error: 'name cant be blank' })
        }
    }

    async editPlayer({ response, request, params }) {
        const player = await Room.find(params.id)
        try {
            await player.merge(request.body)
            await player.save()

            return response.send({ status: 'success', saved: player })
        } catch (err) {
            return response.send({ status: 'fail', error: err })
        }
    }

    async createTypePirce ({ response, request }) {
        const {
            court_type_id,
            period_price_id
        } = request.body

        let typePrice = new TypePrice()
        typePrice.court_type_id = court_type_id
        typePrice.period_price_id = period_price_id
        try {
            await typePrice.save()
            return response.send({status: 'success', typePrice_id: typePrice.id})
        } catch (err) {
            return response.send({status: 'fail', error: err})
        }
    }

    async editTypePirce ({ response, request, params }) {
        const body = request.body
        let typePrice = await TypePrice.find(params.id)
        try {
            await typePrice.merge(body)
            await typePrice.save()
            return response.send({status: 'success', updated: typePrice})
        } catch (err) {
            return response.send({status: 'fail', error: err})
        }
    }

    async editCourtType ({ response, request, params }) {
        const body = request.post()
        const court_type = await CourtType.find(params.id)
        
        try {
            await court_type.merge(body)
            await court_type.save()
        
            return response.send({status : 'Success', updated : `CourtType ID : ${court_type.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }

    async pitchSummary ({ request, response, auth, params }) {
        let timeStart = request.body.date
        let timeEnd = moment(timeStart,'YYYY-MM-DD HH:mm:ss').add(1,'days').format('YYYY-MM-DD HH:mm:ss')
        if (request.body.type == 'month'){
            timeStart = moment(timeStart).set('date',1).format('YYYY-MM-DD HH:mm:ss')
            timeEnd = moment(timeStart,'YYYY-MM-DD HH:mm:ss').add(1,'months').format('YYYY-MM-DD HH:mm:ss')
        }
        const sp = await auth.getUser()
        const result = {
            matches: await getAllMatches(sp,timeStart,timeEnd),
            income: await getIncome(sp,timeStart,timeEnd,false),
            player: await getAllPlayer(sp,timeStart,timeEnd,false)
        }

        return response.send(result)
    }

    async createFixedTime ({ response, request }) {
        const {
            court_type_id,
            days,
            time
        } = request.body
        
        try {
            
        var created = []
        for(var i=0;i<time.length;i++) {
            let fixed_time = await FixedTime.create({
                court_type_id: court_type_id,
                days: days,
                time_start: time[i].time_start,
                time_end: time[i].time_end
            })
            created.push(fixed_time)
        }

            return response.send({status: 'success', created: created })
        } catch (err) {
            return response.send({status: 'fail', error: err})
        }
    }

    async editFixedTime ({ response, request, params }) {
        try {
            const { fixed_time, edit_fixed_time } = request.body
            const { create, remove } = edit_fixed_time

            var edited_fixTime = []
            var created_fixTime = []
            var removed_fixTime = []
            if (fixed_time) {
                for (var i=0;i<fixed_time.length;i++) {
                    const fixedTime = await FixedTime.find(fixed_time[i].id)
                    delete fixed_time[i].id
                    if (fixedTime) {
                        await fixedTime.merge(fixed_time[i])
                        await fixedTime.save()
                        edited_fixTime.push(fixedTime)
                    }
                }
            }
            if (create) {
                const { court_type_id, days, time } = create
                for(var i=0;i<time.length;i++) {
                    let fixedTime = await FixedTime.create({
                        court_type_id: court_type_id,
                        days: days,
                        time_start: time[i].time_start,
                        time_end: time[i].time_end
                    })
                    created_fixTime.push(fixedTime)
                }
            }
            if (remove) {
                for (var i=0;i<remove.length;i++) {
                    const delete_fixTime = await FixedTime.find(remove[i])
                    if (delete_fixTime) {
                        await delete_fixTime.delete()
                        removed_fixTime.push(delete_fixTime)
                    }
                }
            }

            return response.send({status: 'success', edit: edited_fixTime, create: created_fixTime, deleted: removed_fixTime })
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err})
        }
    }

    async deleteFixedTime ({ response, params }) {
        try {
            const fixed_time = await FixedTime.find(params.id)
            await fixed_time.delete()

            return response.send({status: 'success', edited: fixed_time.id })
        } catch (err) {
            return response.send({status: 'fail', error: err})
        }
    }
}

module.exports = ProviderController

// To query Provider by ID
const getProvider = (id) => {
    return Provider.find(id)
}
// To query court type by ID
const getCourtType = (id) => {
    return CourtType.find(id)
}
async function getFreeCourt(provider_id, court_types_ids, time_start, time_end) {
    let provider = await getProvider(provider_id)

    // TODO: modify
    let day = moment(time_start, 'YYYY-MM-DD HH:mm').format('e')

    let com_start = moment(time_start, 'YYYY-MM-DD HH:mm').unix()
    let com_end = moment(time_end, 'YYYY-MM-DD HH:mm').unix()
    if (com_start > com_end) {
        time_end = moment(time_end, 'YYYY-MM-DD HH:mm').add(1, 'days').format('YYYY-MM-DD HH:mm')
    }//check TimeEnd Day

    if (provider.available == 1) {
        let pas_start = moment(time_start, 'YYYY-MM-DD HH:mm').add(1, 'minutes').format('YYYY-MM-DD HH:mm')

        if (parseInt(provider.maxTime, 10) > 23) {
            provider.maxTime = `${parseInt(provider.maxTime, 10) - 24}:00`
        }

        let pas_end =
            moment(`
                ${moment(time_end, 'YYYY-MM-DD HH:mm').startOf('day').format('YYYY-MM-DD')} 
                ${provider.maxTime}`, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm')

        let checkMin = moment(pas_start, 'YYYY-MM-DD HH:mm').format('HH:mm')
        let checkMax = moment(pas_end, 'YYYY-MM-DD HH:mm').format('HH:mm')
        if (parseInt(checkMax, 10) < parseInt(checkMin, 10)) {
            pas_end = moment(pas_end, 'YYYY-MM-DD HH:mm').add(1, 'days').format('YYYY-MM-DD HH:mm')
        }

        if (parseInt(checkMin, 10) < 4) {
            day = day - 1
            if (day < 0) {
                day = 6
            }
        }

        // =====================================================================================================================

        if (court_types_ids === undefined || court_types_ids == null) {
            return {free: null}
        }

        let court_type_id = -1
        let court_type = null
        let queryFreeCourt = null
        let free_court = []

        for(var i = 0; i < court_types_ids.length; i++) {
            court_type_id = court_types_ids[i]
            court_type = await getCourtType(court_type_id)

            queryFreeCourt = await court_type
                .courts()
                .whereDoesntHave('matches', (match) => {
                    match.where('cancel', 0)
                    match.where(function() {
                        this.whereBetween('time_start', [pas_start, time_end])
                        this.orWhereBetween('time_end', [pas_start, time_end])
                        this.orWhere(function () {
                            this.where('time_start', '<=', pas_start)
                            this.where('time_start', '<=', time_end)
                            this.where('time_end', '>=', pas_start)
                            this.where('time_end', '>=', time_end)
                        })
                    })
                })
                .fetch()
            
            free_court.push({
                provider_id: provider_id,
                court_type_id: court_type_id,
                courts: queryFreeCourt
            })
        }

        // =====================================================================================================================

        return {
            free: free_court
        }
    }
}
async function findMinPriceCourts(courts) {
    if(courts === undefined || courts == null) {
        return {}
    }

    let result = {}
    let min_price = Number.MAX_SAFE_INTEGER

    for(let i = 0; i < courts.length; i++) {
        let court = courts[i]

        if(court.price < min_price) {
            min_price = court.price;
            result = court
        }
    }

    return result
}
//Tool functions
function mergeTime(uniq) {
    for (let a = 0; a < uniq.length; a++) {
        let com = uniq[a].split('-')
        try {
            if (a < uniq.length) {
                let par = uniq[a + 1].split('-')
                if (parseInt(com[0], 10) == parseInt(par[0], 10) && parseInt(com[1], 10) < parseInt(par[1], 10)) {
                    uniq.splice(a, 1)
                } else if (parseInt(com[0], 10) < parseInt(par[0], 10) && parseInt(com[1], 10) > parseInt(par[1], 10) && parseInt(par[1], 10) > 6) {
                    uniq.splice(a + 1, 1)
                } else if (parseInt(com[0], 10) < parseInt(par[0], 10) && parseInt(com[1], 10) == parseInt(par[1], 10)) {
                    uniq.splice(a + 1, 1)
                } else if (parseInt(com[0], 10) == parseInt(par[0], 10) && parseInt(com[1], 10) > parseInt(par[1], 10)) {
                    uniq.splice(a + 1, 1)
                }
            }
        } catch (err) {

        }
    }
}

function addWeeks(timeStart, timeEnd, week) {
    const start = moment(timeStart, 'YYYY-MM-DD HH:mm')
        .add(7 * week, 'days')
        .format('YYYY-MM-DD HH:mm')

    const end = moment(timeEnd, 'YYYY-MM-DD HH:mm')
        .add(7 * week, 'days')
        .format('YYYY-MM-DD HH:mm')

    return { time_start: start, time_end: end }
}

//Get number of match for summary
async function getAllMatches(sp,timeStart,timeEnd){
    const matches = await sp
                    .provider_sports()
                    .with('court_types',(ct)=> {
                        ct.with('matches',(bd)=>{
                            bd.whereBetween('time_start',[timeStart,timeEnd])
                        })
                    })                        
                    .fetch()
                    
    let match = []
    matches.toJSON().map(sport => {
        sport.court_types.map(court_type => {
            match.push(court_type.matches.length)
        })
    })
    let sum = match.reduce((a,b) => a + b, 0)

    return sum
}

//Get income for summary
async function getIncome(sp,timeStart,timeEnd,all){
    const matches =  await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(bd)=>{
                                bd.where('cancel',0)
                                bd.whereBetween('time_start',[timeStart,timeEnd])
                                bd.with('court')
                            })
                        })
                        .fetch()

        const pro_sport = matches.toJSON().filter(ps => {
            if (all) {
                return ps
            } else {
                return ps.id = sp.id 
            }
        })

        let res = pro_sport[0].court_types
        let price = []
        res.map(type => {
            type.matches.map(match => {
                if (match.total_price > 0) {
                    price.push(match.total_price)
                }else {
                    price.push(match.court.price)
                }
            })
        })
        let sum = price.reduce((a,b) => a + b, 0)
        let addComma = sum.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
        
        return addComma
}

//Get number of player for summary
async function getAllPlayer (sp,timeStart,timeEnd,all) {

    const matches = await sp
                    .provider_sports()
                    .with('court_types',(ct)=>{
                        ct.with('matches',(mt)=>{
                            mt.whereBetween('time_start',[timeStart,timeEnd])
                            .with('court')
                            .with('user')
                            .with('rooms',(rm)=>{
                                rm.where('accept','=',1)
                                .with('user')
                            })
                        })
                    })
                    .fetch()
    
    const pro_sport = matches.toJSON().filter(ps => {
        if (all) {
            return ps
        } else {
            return ps.id == sp.id
        }
    })

    let res = pro_sport[0].court_types
    let creator = []
    let joiner = []

    var i;
    for (i=0;i<res.length;i++) {
        let matches = res[i].matches
        matches.map(match => {
            if (match.user != null) {
                creator.push(match.user.fullname)
            }
            if (match.rooms) {
                match.rooms.map(room => {
                    if (room.user != null) {
                        joiner.push(room.user.fullname)
                    }
                })
            }
        })
    }

    let allplayer = creator.concat(joiner);
    let dif = Array.from(new Set(allplayer))

    return dif.length
}
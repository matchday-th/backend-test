'use strict'

const Utility = require("../Utility")
const { Tools } = require("../Utility")
const Helper = require('../Helper')

const User = use('App/Models/User')
const Promotion = use('App/Models/Promotion')
const Match = use('App/Models/Match')
const Database = use('Database')
const moment = use('moment')
const timeFormat = 'YYYY-MM-DD HH:mm:ss'

class ArenaDashboardController {
    async user_all ({ response, request, auth }) {
        const { time_start, time_end } = request.body
        const sp = await auth.getUser()
        var matches = await Match
                        .query()
                        .whereBetween('time_start',[time_start, time_end])
                        .whereHas('court.court_type.provider_sport',(ps)=> {
                            ps.where('provider_id',sp.id)
                        })
                        .where('cancel',0)
                        .with('user')
                        .fetch()

        matches = matches.toJSON()
        var sum = matches.length
        var online = matches.filter(m => m.user).length
        var joiner = sum - online

        // matches.toJSON().forEach(m => {
        //     if (m.user) {
        //         var ids = m.user.id
        //         sum.push(ids)
        //         online.push(ids)

        //     } else if (m.rooms.length > 0) {
        //         var ids = m.rooms.map(r => r.id)
        //         ids.forEach(r => {
        //             joiner.push(r)
        //             sum.push(r)
        //         })
        //     }
        // })
        // joiner = [...new Set(joiner)]
        // online = [...new Set(online)]
        // sum = [...new Set(sum)]

        return response.send({
            user_all: sum,
            user_online: online,
            user_offline: joiner
        })
    }

    async user_new ({ response, request, auth}) {
        const { time_start, time_end } = request.body
        const sp = await auth.getUser()
        const matchesA = await Match
            .query()
            .whereBetween('time_start',[time_start, time_end])
            .whereHas('court.court_type.provider_sport',(ps)=> {
                ps.where('provider_id',sp.id)
            })
            .where('cancel',0)
            .whereHas('user')
            .fetch()

        const matchesB = await Match
            .query()
            .whereBetween('time_start',[moment(time_start,timeFormat).subtract(1,'month').format(timeFormat), time_start])
            .whereHas('court.court_type.provider_sport',(ps)=> {
                ps.where('provider_id',sp.id)
            })
            .where('cancel',0)
            .whereHas('user')
            .fetch()

        const result = matchesA.toJSON().length - matchesB.toJSON().length
            
        return response.send({
            user_new: (result>0)? result:0
        })
    }

    async user_data ({ response, request, auth }) {
        const { time_start, time_end } = request.body
        const sp = await auth.getUser()
        var matches = await Match
            .query()
            .whereBetween('time_start',[time_start, time_end])
            .whereHas('court.court_type.provider_sport',(ps)=> {
                ps.where('provider_id',sp.id)
            })
            .where('cancel',0)
            .whereHas('user')
            .with('user')
            .fetch()
        matches = matches.toJSON()
        matches = matches.map(m => m = { age: m.user.dob, sex: m.user.sex}).filter(u => u != null)
        var teen = []
        var adult = []
        var old = []
        var male = []
        var female = []

        matches.forEach(m => {
            var age = moment().diff(moment(m.age,'DD/MM/YYYY'),'years')
            if (age < 21) {
                teen.push(m)
            } else if (age > 20 && age < 41) {
                adult.push(m)
            } else if (age > 40 && age < 61) {
                old.push(m)
            }

            if (m.sex == 'Male') {
                male.push(1)
            } else if (m.sex == 'Female') {
                female.push(1)
            }
        })
        var total = matches.length
        return response.send({
            ages: [
                { key: '0-20', value: ((teen.length/total)*100).toFixed(1) },
                { key: '21-40', value: ((adult.length/total)*100).toFixed(1) },
                { key: '41-60', value: ((old.length/total)*100).toFixed(1) },
                { key: 'other', value: (100 - parseFloat(((teen.length/total)*100).toFixed(1)) - parseFloat(((adult.length/total)*100).toFixed(1)) - parseFloat(((old.length/total)*100).toFixed(1))).toFixed(1) },
            ],
            genders: [
                { key: 'other', value: (100 - parseFloat(((male.length/total)*100).toFixed(1)) - parseFloat(((female.length/total)*100).toFixed(1))).toFixed(1) },
                { key: 'female', value: ((female.length/total)*100).toFixed(1) },
                { key: 'male', value: ((male.length/total)*100).toFixed(1) },
              ]
        })
    }

    async view_growth ({ response, request, auth }) {
        const { time_start } = request.body
        const sp = await auth.getUser()
        const since = sp.toJSON().created_at
        const dif = moment(time_start,timeFormat).diff(moment(since,timeFormat),'month',true)

        return response.send({
            views: sp.view,
            growth: parseInt((sp.view/dif).toFixed(2),10)
        })
    }

    async confirm_rate ({ response, request, auth }) {
        const { time_start, time_end } = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .whereBetween('time_start',[time_start, time_end])
            .whereHas('court.court_type.provider_sport',(ps)=> {
                ps.where('provider_id',sp.id)
            })
            .where('cancel',0)
            .select(['id','check_in'])
            .fetch()

        var checked = []
        matches.toJSON().forEach(m => {
            if (m.paid_amount == m.total_price) {
                checked.push(m)
            }
        })

        return response.send({
            rate_confirm: parseFloat(((checked.length/matches.toJSON().length)*100).toFixed(2))
        })
    }

    async match_all ({ response, request, auth }) {
        const { time_start, time_end } = request.body
        const sp = await auth.getUser()
        var court_types = await sp
            .court_types()
            .with('courts',(c)=> {
                c.with('matches',(m)=> {
                    m.whereBetween('time_end',[time_start, time_end])
                    m.where('cancel',0)
                    m.where('deleted',0)
                })
            })
            .fetch()
            
        var courts = []
        court_types.toJSON().forEach(ct => {
            ct.courts.forEach(c => {
                courts.push({ 
                    id: c.id, 
                    name: c.name, 
                    matches: c.matches.length, 
                    duration: c.matches.map(m => Helper.getDuration({ time_start: m.time_start, time_end: m.time_end },'hours')).reduce((a,b) => a+b,0)
                })
            })
        })

        return response.send({
            matches: courts.map(c => c.matches).reduce((a,b)=> a+b),
            courts: courts
        })
    }

    async match_abandon ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .where('cancel',0)
            .where('check_in',0)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .fetch()

        return response.send({
            abandoned: matches.toJSON().length
        })
    }

    async match_abandon_rate ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const abandoned = await Match
            .query()
            .where('cancel',0)
            .where('check_in',0)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .fetch()

        const all = await Match
            .query()
            .where('cancel',0)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .fetch()

        return response.send({
            abandoned_rate: parseFloat(((abandoned.toJSON().length/all.toJSON().length)*100).toFixed(2))
        })
    }

    async match_cancel ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .where('cancel',1)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .fetch()

        const result = []

        return response.send({total_cancel: matches.toJSON().length, cancel:result })
    }

    async revenue_all ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .where('cancel',0)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .with('court.court_type.provider_sport.sport')
            .with('services')
            .with('inventories.item_type')
            .fetch()
            
        var match_adjusted = matches.toJSON().map(m => {
            m.total_price = Utility.Calculation.match_total_price(m)
            return m
        })
        const week1 = Tools.match_timeDivider_monthToWeeks(match_adjusted,[time_start,time_end])

        return response.send(week1)
    }

    async revenue_rate ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .where('cancel',0)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .with('services')
            .with('inventories.item_type')
            .fetch()

        const total_hours = moment(time_end,timeFormat).diff(moment(time_start,timeFormat),'hours',true)
        var total_rev = [0,0]
        var total_used = [0,0]
        matches.toJSON().forEach(m => {
            if (m.total_price) {
                total_used.push(parseFloat(moment(m.time_end,timeFormat).diff(moment(m.time_start,timeFormat).subtract(1,'minutes'),'hours',true).toFixed(1),10))
                total_rev.push(Utility.Calculation.match_total_price(m))
            }
        })
        total_used = total_used.reduce((a,b)=> a+b)
        total_rev = total_rev.reduce((a,b)=> a+b)

        return response.send({
            rate: parseFloat(((total_used/total_hours)*100).toFixed(2)),
            revenue: parseFloat((total_rev/total_used).toFixed(1))
        })
    }

    async promotion_all ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const promos = await Promotion
            .query()
            .where('provider_id',sp.id)
            .where('expire_end','<=',time_end)
            .andWhere('expire_start','>=',time_start)
            .with('promotion_users')
            .fetch()

        return response.send({
            promotions: promos.toJSON().length
        })
    }

    async promotion_used ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const promos = await Promotion
            .query()
            .where('provider_id',sp.id)
            .where('expire_end','<=',time_end)
            .andWhere('expire_start','>=',time_start)
            .with('promotion_users')
            .fetch()
        
        const result = []
        promos.toJSON().forEach(p => {
            result.push(p)
        })
        
        return response.send([result.length])
    }

    async time_peak ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .where('cancel',0)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .fetch()

        const result = Tools.match_timeDivider_monthToTime(matches.toJSON(),[time_start,time_end],[sp.minTime,sp.maxTime])
        
        return response.send(result)
    }

    async time_cancel ({ response, request, auth }) {
        const { time_start, time_end} = request.body
        const sp = await auth.getUser()
        const matches = await Match
            .query()
            .where('cancel',1)
            .whereBetween('time_start',[time_start,time_end])
            .whereHas('court.court_type.provider_sport',(ps) => {
                ps.where('provider_id',sp.id)
            })
            .fetch()

        const result = Tools.match_timeDivider_monthToTime(matches.toJSON(),[time_start,time_end],[sp.minTime,sp.maxTime])
        
        return response.send(result)
    }

}

module.exports = ArenaDashboardController

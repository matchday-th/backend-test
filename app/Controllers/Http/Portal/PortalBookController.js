'use strict'

const User = use('App/Models/User')
const Stack = use('App/Models/Stack')
const Provider = use('App/Models/Provider')
const Match = use('App/Models/Match')
const moment = use('moment')
const Pref = use('App/Models/Preference')

const Utility = require('../Utility')
const { Checker, Creator, Mutator, Validator, Tools, FindOrCreate ,Notification} = require('../Utility')

class PortalBookController {
    async newPortalUser({ request, response, auth }) {
        const {
            phone,
            phone_number,
            email,
            name,
            fullname } = request.body

        var result = []
        if (phone || phone_number) {
            try {
                let user_from_phone = await User.findBy('phone_number',phone? phone:phone_number)
                if (user_from_phone) {
                    let token = await auth.generate(user_from_phone)
                    result.push({user: user_from_phone, token:token, found:'phone', status: 'registered'})
                }
    
            } catch (err) {}
        }
        
        if (email) {
            try {
                let user_email = await User.findBy('email',email)
    
                if (user_email) {
                    let token = await auth.generate(user_email)
                    result.push({user: userPhone, token:token, found:'email', status: 'pre-registered'})
                }
            } catch (err) {}
        }

        if (result.length > 0) {

            return response.send({status: 'registered', 
            user: {
                id: result[0].user.id,
                fullname: result[0].user.fullname,
                phone_number: result[0].user.phone_number,
                email: result[0].user.email,
                password: result[0].user.password
            }, token: result[0].token.token})

        } else {
            try {
                let user = new User()
                user.fullname = Validator.user_fullname(fullname? fullname:name,'fullname')
                user.firstname = Validator.user_fullname(fullname? fullname:name,'firstname')
                user.lastname = Validator.user_fullname(fullname? fullname:name,'lastname')
                user.password = phone
                user.email = email? email:`${phone}@matchday.co.th`
                user.phone_number = phone
                user.pre_regis = true

                await user.save()
                let token = await auth.generate(user)

                return response.send({ status: 'pre-register', user: {
                    id: user.id,
                    fullname: user.fullname,
                    phone_number: user.phone_number,
                    email: user.email,
                    password: user.password
                }, token:token.token })

            } catch (err) {
                console.log(err);
                return response.send({ status: 'fail', error:err })
            }
        }
    }
    async portalUser({ request, response, auth }) {
        const { name, phone, email } = request.body
        var result = []

        try {
            let userPhone = await User.findBy('phone_number',phone)

            if (userPhone) {
                let token = await auth.generate(userPhone)
                result.push({user: userPhone, token:token, found:'phone', status: 'registered'})
            }

        } catch (err) {}

        try {
            let p_userPhone = await User.findBy('phone_number','p'+phone)

            if (p_userPhone) {
                let token = await auth.generate(p_userPhone)
                result.push({user: userPhone, token:token, found:'phone', status: 'pre-registered'})
            }

        } catch (err) {}

        try {
            let user_email = await User.findBy('email',email)

            if (user_email) {
                let token = await auth.generate(user_email)
                result.push({user: userPhone, token:token, found:'email', status: 'pre-registered'})
            }
        } catch (err) {}
        
        if (result.length > 0) {
            return response.send({status: 'registered', user: {
                id: result[0].user.id,
                fullname: result[0].user.fullname,
                phone_number: result[0].user.phone_number,
                email: result[0].user.email,
                password: result[0].user.password
            }, token: result[0].token.token})

        } else {
            try {
                let user = new User()
                user.fullname = name
                user.password = phone
                user.email = email? email:`${phone}@matchday.co.th`
                user.phone_number = phone
                user.pre_regis = true

                await user.save()
                let token = await auth.generate(user)

                return response.send({ status: 'pre-register', user: {
                    id: user.id,
                    fullname: user.fullname,
                    phone_number: user.phone_number,
                    email: user.email,
                    password: user.password
                }, token:token.token })
            } catch (err) {
                return response.send({ status: 'fail to register', error:err })
            }
        }
    }

    async user_for_payment({ request, response, auth }) {
        const {
            phone_number,
            email,
            fullname } = request.body
            
        try {
            const user = await FindOrCreate.user_phoneOrEmail({ phone_number, email, fullname })
            let token = await auth.generate(user)
            return response.send({ status: user.pre_regis? 'pre-register':'registered', user: {
                id: user.id,
                fullname: user.fullname,
                phone_number: user.phone_number,
                email: user.email,
                password: user.password
            }, token:token.token })
        } catch (err) {
            console.log(err);   
        }

    }

    async portalUserHistory({ request, response, auth, params }) {
        try {
            const user = await auth.getUser()
            var id = [params.id]
            if (params.id == 'all') {
                var provider = await Provider.query().where('available', 1).select(['id']).fetch()
                provider = provider.toJSON()
                id = provider.map(({ id}) => id)
            }
            
            const matches = await user
                            .matches()
                            .where('cancel',0)
                            .whereHas('court.court_type.provider_sport', (c) => {
                                c.with('sport')
                                c.whereHas('provider',(p) => {
                                    p.whereIn('id',id)
                                })
                            })
                            .with('court.court_type.provider_sport', (c) => {
                                c.with('sport')
                                c.whereHas('provider',(p) => {
                                    p.whereIn('id',id)
                                })
                                c.with('provider',(p) => {
                                    p.whereIn('id',id)
                                })
                            })
                            .with('payments')
                            .fetch()

            const match_ids = matches.toJSON().map(m => m = m.id)
            await Utility.Checker.check_unpaid_match(match_ids)

            const output = matches.toJSON().map(match => {
                const { logo, logo2, logo3, logo_backup } = match.court.court_type.provider_sport.provider
                const { image } = match.court.court_type
                const court_cover = [ image, logo, logo2, logo3, logo_backup ].filter(res => res)

                return {
                    id: match.id,
                    day: moment(match.time_start,'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY'),
                    time_start: moment(match.time_start,'YYYY-MM-DD HH:mm:ss').subtract(1,'minutes').format('HH:mm'),
                    time_end: moment(match.time_end,'YYYY-MM-DD HH:mm:ss').format('HH:mm'),
                    match_time: { time_start: match.time_start, time_end: match.time_end },
                    court: match.court.name+'-'+match.court.court_type.name,
                    court_img: court_cover.length? court_cover[0]:'',
                    total_price: (match.total_price)? match.total_price:match.court.price*(moment(match.time_end,'YYYY-MM-DD HH:mm:ss').diff(moment(match.time_start,'YYYY-MM-DD HH:mm:ss').subtract(1,'minutes'),'hours')),
                    sport: match.court.court_type.provider_sport.sport.name,
                    pay_status: { method: (match.total_price == match.paid_amount)? 'online':'cash', status:(match.total_price == match.paid_amount)? 'paid':'unpaid' },
                    match_status: (moment(match.time_end,'YYYY-MM-DD HH:mm:ss').unix() < moment().unix())? 'ended':'incoming'
                }
            })

            return response.send(output)
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async portalCreateMatch({ request, response, auth }) {
        try {
            const user = await auth.getUser()
            var match = request.body
            match.user = user.toJSON()

            if(match.preference != null && match.preference.create == true) {
              // create preference
              let pref = new Pref()
              pref.user_id = user.id
              pref.name = match.preference.name
              pref.sex = match.preference.gender
              pref.age_a = match.preference.age_a
              pref.age_b = match.preference.age_b
              pref.team_size = match.preference.team_size
              pref.message = match.preference.message

              await pref.save()

              if(match.settings == null) {
                match.settings = {}
              }

              match.settings.room_switch = 1
              match.settings.preference_id = pref.id;
            }
            
            var result = await Creator.makeMatch(match,(match.getMail != undefined)? match.getMail:true, match.method? match.method:'portal')
            result.status = (result.matches.length>0)? true:false

            return response.send(result)
        } catch (err) {
            console.log(err)
            return response.send(err.toString())
        }
    }

    async portalCancelMatch({ response, params, auth}) {
        var match = await Match.find(params.id)
        const user = await auth.getUser()
        try {
            await match.merge( { cancel: 1 })
            await match.save()
            await match.load('court.court_type.provider_sport.provider')
            match = match.toJSON()
            var provider = match.court.court_type.provider_sport.provider

            await Notification.notificationSender({matches: [match], user, type: 'CancelMatch'},provider.id)
            return response.send({ status:'success', match:match})
        } catch (err) {
            console.log(err);
            return response.send({ status:'fail', error:err })
        }
    }

    async portalCheckToEdit({ response, request }) {
        const { court, time_start, time_end } = request.body

        try {
            const res = await Checker.checkCourt(court, time_start, time_end)
            return response.send({free: res})
        } catch (err) {
            return response.send({error: err.toString()})
        }
    }

    async portalEditMatch({ response, request, params, auth}) {
        try {
            var match = await Match.find(params.id)
            const user = await auth.getUser()
            await match.merge(request.body)
            await match.save()
            await match.load('court.court_type.provider_sport.provider')
            match = match.toJSON()
            var provider = match.court.court_type.provider_sport.provider

            await Notification.notificationSender({matches: [match], user, type: 'UpdateMatch'},provider.id)
            return response.send({status: 'success', updated: match})
        } catch (err) {
            console.log(err);
        }
    }

    async testEmail({ response, params }) {
        let book = {
            provider: 'Matchday Arena',
            id: 1,
            day: '22/12/2020',
            time_start: '16:00',
            time_end: '18:00',
            court: 'Bas 1',
            user: {fullname:'ภูวนาท ระเริงกลิ่น',phone_number:'0994936528',email: 'booking.matchday@gmail.com'},
            total_price: 2000,
            payment: { status: 'ยังไม่ชำระ',method: 'จ่ายที่สนาม'},
            create_at: '22/12/2020 12:42'
        }
        var time;
        console.time('mail');
        await Tools.emailCreateMatch({ match: book })
        console.timeEnd('mail');
        return response.send({ status: 'success'})
    }
}

module.exports = PortalBookController

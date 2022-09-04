'use strict'

const moment = use('moment')
const Mail = use('Mail')
const Sport = use('App/Models/Sport')
const Match = use('App/Models/Match')
const Provider = use('App/Models/Provider')
const Court = use('App/Models/Court')
const User = use('App/Models/User')
const Asset = use('App/Models/Asset')
const AssetBundle = use('App/Models/AssetBundle')
const CustomText = use('App/Models/CustomText')
const { isInRange, timeFormat } = require('../Helper')
const { Checker, Mutator, Validator, SMS, OTP, Email } = require('../Utility')
class SystemController {

    async sendMail ({ response }) {
        const mail = await Email.emailSender({
            type: 'ResetPass',
            id: 9999,
            provider: 'TEST_PROVIDER',
            day: '01/01/2020',
            time_start: '15:00',
            time_end: '16:00',
            courts: '1',
            total_price: 999,
            add_price: '-ไม่มี-',
            user: {
                fullname: 'TEST_USER',
                phone_number: '0555555555',
                email:' champmarr@gmail.com'
            },
            token: 'TOKEN123',
            fullname: 'TEST_RESETPASS'
        })

        return response.send(mail)
    }

    async bulkUpdate ({ response }) {
        try {
            return response.send('ok')
        } catch (err) {
            console.log(err);
            return response.send('not ok')
        }
    }

    async testQuery ({ response, auth }) {
        var provider = await Provider.find(14)
        const checkToEnd = await provider
                .provider_sports()
                .with('sport')
                .with('court_types', (bd) => {
                    bd.with('courts', (sp) => {
                        sp.whereIn('id', [100,101])
                    })
                    bd.with('fixed_courts')
                })
                .fetch()

        return response.send(res)
    }

    async allSport ({ response }) {
        let sports = await Sport
            .query()
            .whereNot('available',0)
            .fetch()
            
        return response.send(sports)
    }

    async checkLongbook ({ request, response}) {
        var {
            time,
            courts,
            type
        } = request.body
        courts = courts.map(court => court.id)
        time.time_start = Validator.matchTimeInput(time.time_start, time.time_end)

        let result = []
        check:
        for (let i=0; i<12; i++) {
            for (var c=0; c<courts.length; c++) {
                if (await Checker.checkCourt(courts[c],
                    Mutator.repeatBookDate(time.time_start,type? type:'week',i),
                    Mutator.repeatBookDate(time.time_end,type? type:'week',i))) {
                    result.push(i)
                } else {
                    break check
                }
            }
        }

        //remove duplicate
        result = [...new Set(result)];
                
        return response.send(result)
    }

    async resetPassword ({ request, response, auth }) {
        const { email } = request.body
        const user = await User.findBy('email',email)

        let token = await auth.generate(user)
        try {

        await Mail.send('email.actions.ResetPass', {fullname:user.fullname,token:token.token,lang:user.lang}, (message) => {
            message
                .to(user.email)
                .from('booking.matchday@gmail.com')
                .subject('รีเซ็ตรหัสผ่าน Matchday')
            }) 

            return response.send({status: 'success', msg: 'Email Sent!', token: token})
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err.toString()})
        }
        
    }

    async setPassword ({ request, response, auth }) {
        const Model = {
            Arena: Provider,
            User: User
        }
        await auth.check()
        const { uid, sub } = auth.jwtPayload
        const user = await Model[sub].find(uid)
        try {
            if (request.body.password) {
                await user.merge(request.body)
                await user.save()

                return response.send({status: 'success', msg: 'password changed!'})
            }
        } catch (err) {
            return response.send({status : 'fail', error:err})
        }
    }

    async detectFullname ({ request, response }) {
        const check = await User.findBy('fullname',request.body.name)

        if (check | request.body.name == null) {
            return response.send({status : 'fail'})
        } else {
            return response.send({status : 'success'})
        }
    }

    async detectPhone ({ request, response }) {
        try {
            var user = await User
                .query()
                .where('pre_regis',false)
                .where('phone_number',request.body.phone)
                .fetch()
            user = user.toJSON()
            if (user.length > 1) {
                return response.send({status: 'registered',user: user})
            } else {
                return response.send({status: 'un-registered', user: user})
            }
        } catch (err) {
            return response.send({status: 'fail', msg: err})
        }
    }

    async detectEmail ({ request, response }) {
        try {
            const user = await User.findBy('email',request.body.email)
            if (user != null) {
                return response.send({status: 'registered',user: user})
            } else {
                return response.send({status: 'un-registered', user: user})
            }
        } catch (err) {
            return response.send({status: 'fail', msg: err})
        }
    }

    async detectUsername ({ request, response }) {
        try {
            const user = await User.findBy('username',request.body.username)
            if (user != null) {
                return response.send({status: 'registered',user: user})
            } else {
                return response.send({status: 'un-registered', user: user})
            }
        } catch (err) {
            return response.send({status: 'fail', msg: err})
        }
    }

    async request_otp ({ request, response }) {
        try {
            const expire_minute = 1
            const prefix = '+66'
            const text = await SMS.send_otp(prefix+request.get().tel,expire_minute)

            return response.send({ status: 'success', phone_number:text.phone, ref:text.ref })
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err })
        }
    }

    async verify_otp ({ request, response }) {
        try {
            const {
                otp_code,
                ref
            } = request.body
            
            const result = await OTP.verify_otp(otp_code, ref)
            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }

    }
    
    async my_promo_bundle ({ request, response, auth, params }) {
        const user = await auth.getUser()
        const asset_bundles = await Asset
            .query()
            .where('user_id',user.id)
            .with('asset_bundles',(ab)=> {
                ab.with('bundle')
                ab.with('used_bundles')
            })
            .fetch()
        
        const { time_start, time_end } = request.get()
        if (asset_bundles.toJSON().length > 0) {
            const result = {
                bundles: asset_bundles.toJSON()[0].asset_bundles.map(ab => ab = {
                    asset_bundle_id: ab.id,
                    provider_id:ab.bundle.provider_id,
                    name: ab.bundle.name,
                    redeem_code: ab.redeem_code,
                    image: ab.bundle.image,
                    expire_date: ab.expire_end,
                    remaining: ab.bundle.code_limits - ab.used_bundles.length,
                    available: Checker.dow_time_range(ab.bundle.serving_period,ab.bundle.serving_dow, { time_start, time_end})
                }).filter(bundle => bundle.remaining>0)
            }
    
            return response.send(result)
        } else {
            return response.send([])
        }
    }
    
    async getText({response,params}){
        const text = await CustomText.find(params.id)
        return response.send(text.text)
    }
}

module.exports = SystemController

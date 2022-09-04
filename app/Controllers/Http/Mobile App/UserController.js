'use strict'

const User = use('App/Models/User')
const Match = use('App/Models/Match')
const Rating = use('App/Models/Rating')
const moment = use('moment')
const Promo = use('App/Models/Promotion')
const MyPromo = use('App/Models/PromotionUser')
const Member = use('App/Models/Member')
const { timeFormat } = require('../Helper.js')
const { Mutator } = require('../Utility.js')
const AssetBundle = use('App/Models/AssetBundle')
const UserUuid = use('App/Models/UserUuid')

const Database = use('Database')

class UserController {

    async register ({request, response, auth}) {

        const {
            username,
            email,
            password,
            avatar,
            fullname,
            firstname,
            lastname,
            phone,
            sex,
            dob
        } = request.body
        
        try {
            let user = new User()
            user.username = username
            user.email = email
            user.password = password
            user.phone_number = phone
            user.fullname = fullname? fullname:`${firstname} ${lastname}`
            user.firstname = firstname
            user.lastname = lastname
            user.avatar = avatar
            user.sex = sex
            user.dob = dob

            await user.save()
            const token = await auth.authenticator('UserPhone').attempt(phone,password)

            return response.send({status: 'success', user:user, token: token})
        } catch (err) {
            console.log(err);
            
            return response.send({status: 'fail', error: err.toString()})
        }
    }

    async ssoAccountRegister ({request, response, auth}) {
        const {
            firstname,
            lastname,
            email,
            phone,
            avatar,
            uid
        } = request.body

        try {
            let user = new User()
            user.username = uid
            user.password = uid
            user.email = email
            user.phone_number = phone
            user.fullname = `${firstname} ${lastname}`
            user.firstname = firstname
            user.lastname = lastname
            user.avatar = avatar

            await user.save()
            const token = await auth.authenticator('jwtPhone').attempt(phone, uid)

            return response.send({status: 'success', user:user, token: token})
        } catch (err) {
            console.log(err);
            
            return response.send({status: 'fail', error: err})
        }
    }

    async ssoAccountLogin ({request, response, auth}) {
        const { uid } = request.post()

        const users = await User
                    .query()
                    .where('username',uid)
                    .fetch()

        try {
            let user = users.toJSON()[0];

            let token = await auth.authenticator('jwtPhone').attempt(user.phone_number,uid)
            return response.send(token)
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err})
        }
    }

    async update ({request, response, auth}) {

        const body = request.post()
        const user = await auth.getUser()

        if (body.firstname && body.lastname) {
            body.fullname = `${body.firstname} ${body.lastname}`
        }
        
        await user.merge(body)
        await user.save()
        
        return response.send({"updated" : user})
    }
    
    async show ({request, response, auth, params}) {
        try {
            const self = await auth.getUser()
            const user = await User
                        .query()
                        .where('id',params.id)
                        .with('matches.court.court_type.provider_sport',(bd)=> {
                            bd.with('sport')
                            bd.with('provider')
                        })
                        .with('rooms.match.court.court_type.provider_sport',(jn)=>{
                            jn.with('sport')
                            jn.with('provider')
                        })
                        .with('ratings.provider')
                        .with('preferences')
                        .with('friends')
                        .with('providers')
                        .fetch()

            let result = user.toJSON()[0]
            result.friend_status = (result.friends.filter(u => u.friend_id == self.id).length > 0)? true:false
            result.match_amount = result.matches.length + result.rooms.length
            result.canceled = result.matches.filter(m => m.cancel == 1).length

            return response.send(result)
        } catch (err) {
            return response.send({error: err.toString()})
        }
    }

    async login ({request, response, auth}) {
        
        const { username, password } = request.post()
        const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

        if (reg.test(username)) {
            let token = await auth.authenticator('UserMail')
            .attempt(username, password)

            return response.send(token)
        } else if (username.length == 10) {
            let token = await auth.authenticator('UserPhone')
            .attempt(username, password)

            return response.send(token)
        }
        else {
            let token = await auth.attempt(username, password)

            return response.send(token)
        }
    }

    async uuid ({request, response, auth}){
       try {
            const { uuid, is_login } = request.post()
            const user = await auth.getUser()
            const user_uuid = await UserUuid
            .query()
            .where('uuid',uuid)
            .where('user_id',user.id)
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
                await user_uuid.save()
                return response.send({status: 'success',"created" : user_uuid})
                
            }
       }catch(err){
            console.log(err);
            return response.send({status: 'fail', error: err.toString() })
       }
    }

    async myProfile ({auth,response}) {
        try {
            const check = await auth.getUser()
            const user = await User
                        .query()
                        .where('id',check.id)
                        .with('matches.court.court_type.provider_sport.provider')
                        .with('rooms',(rm)=> {
                            rm.with('match', (m) => {
                                m.where('cancel',0)
                            })
                        })
                        .with('ratings.provider')
                        .with('preferences')
                        .with('friends')
                        .with('providers')
                        .fetch()

            let result = user.toJSON()[0]
            result.match_amount = result.matches.length + result.rooms.length
            result.canceled = result.matches.filter(m => m.cancel == 1).length
            result.follower = result.friends.length

            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.send({ error: err.toString() })
        }
    }

    async myProfileinSP ({auth,response}) {
        const check = await auth.getUser()
        const user = await User
                    .query()
                    .where('id',check.id)
                    .with('matches',(m) => {
                        m.where('time_end','>=',moment().subtract(1,'months').format('YYYY-MM-DD HH:mm:ss'))
                        m.with('court.court_type.provider_sport',(ps) => {
                            ps.with('sport')
                            ps.with('provider')
                        })
                    })
                    .with('ratings.provider')
                    .with('preferences')
                    .with('providers')
                    .fetch()
                    
        return response.send(user.toJSON()[0])
    }

    async finding ({response,request}) {
        const { phone_number,
                fullname,
                username }= request.body

        if (request.body.phone_number) {
            const users = await Database
                    .select('*')
                    .from('users')
                    .where('phone_number',phone_number)
            return users

        } else if (request.body.fullname) {
            const users = await Database
            .select('*')
            .from('users')
            .where('fullname','like',`${fullname}%`)
            
            return users

        } else if (request.body.username) {
            const users = await Database
            .select('*')
            .from('users')
            .where('username','like',`${username}%`)
            
            return users
        }

        return response.send(users)
    }

    async myBookings ({auth,response}) {
        let now = moment().startOf('day').toDate()

        const check = await auth.getUser()
        const user = await User
                    .query()
                    .where('id',check.id)
                    .with('matches',(mt) => {
                        mt.where('time_end','>=',now)
                        mt.where('cancel',0)
                        mt.where('deleted',0)
                        mt.with('rooms.user')
                        mt.with('stack.matches.court')
                        mt.with('court.court_type.provider_sport',(bd)=> {
                            bd.with('sport')
                            bd.with('provider')
                        })
                        mt.whereDoesntHave('ratings',(rt)=> {
                            rt.where('user_id',check.id)
                        })
                        mt.with('services')
                        mt.with('payments')
                        mt.with('ratings')
                        mt.with('used_bundle')
                    })
                    .fetch()

        let result = user.toJSON().map(user => {
            user.matches.map(match => {
                match.payment_method = Mutator.getMatchPayment(match)
                match.payment_status = Mutator.getMatchStatus(match)
                match.review_status = Mutator.getMatchReview(match)
                return match
            })
            return user
        })[0]

        return response.send(result)
    }

    async joinedBookings ({auth,response}) {
        let now = moment().startOf('day').toDate()

        const check = await auth.getUser()
        const user = await check
                    .rooms()
                    .with('match',(rm)=> {
                        rm.where('cancel',0)
                        rm.where('deleted',0)
                        rm.where('time_end','>=',now)
                        rm.with('user')
                        rm.with('rooms.user')
                        rm.with('court.court_type.provider_sport',(jn)=>{
                            jn.with('sport')
                            jn.with('provider')
                        })
                        rm.whereDoesntHave('ratings',(rt)=> {
                            rt.where('user_id',check.id)
                        })                    
                    })
                    .fetch()        

        return response.send(user)
    }

    async endedBookings ({auth,response,request}) {
        try {
            const { time_start,time_end } = request.body

            const check = await auth.getUser()
            const user = await User
                        .query()
                        .where('id',check.id)
                        .with('matches',(mt) => {
                            mt.where('deleted',0)
                            mt.whereBetween('time_start',[time_start,time_end])
                            mt.orWhereBetween('time_end',[time_start,time_end])
                            mt.with('rooms.user')
                            mt.with('stack')
                            mt.with('ratings')
                            mt.whereHas('court.court_type.provider_sport',(ec)=> {
                                ec.with('sport')
                                ec.with('provider')
                            })
                            mt.with('court.court_type.provider_sport',(bd)=> {
                                bd.with('sport')
                                bd.with('provider')
                            })
                            mt.with('used_bundle')
                        })
                        .with('rooms.match',(rm)=> {
                            rm.whereBetween('time_start',[time_start,time_end])
                            rm.orWhereBetween('time_end',[time_start,time_end])
                            rm.with('user')
                            rm.with('rooms.user')
                            rm.with('ratings')
                            rm.whereHas('court.court_type.provider_sport',(gt)=>{
                                gt.with('sport')
                                gt.with('provider')
                            })
                            rm.with('court.court_type.provider_sport',(jn)=>{
                                jn.with('sport')
                                jn.with('provider')
                            })
                        })
                        .fetch()

            const endedBooked = await User
                        .query()
                        .where('id',check.id)
                        .withCount('matches', (match) => {
                            match.where('time_end','<=', moment().format(timeFormat))
                        })
                        .withCount('rooms as joinedMatches', (room) => {
                            room.whereHas('match', (m) => {
                                m.where('time_end','<=', moment().format(timeFormat))
                            })
                        })
                        .fetch()                    

            let result = user.toJSON().map(user => {
                user.matches.map(match => {
                    match.payment_method = Mutator.getMatchPayment(match)
                    match.payment_status = Mutator.getMatchStatus(match)
                    match.review_status = Mutator.getMatchReview(match)
                    return match
                })
                return user
            })[0]
            result.count = endedBooked.toJSON()[0].__meta__

            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.send({error: err.toString()})
        }
    }

    async matchRating ({ auth, response, request, params }) {
        const user = await auth.getUser()
        const {
            match_id,
            comment,
            score
        } = request.body

        let rating = new Rating()
        rating.provider_id = params.sp_id
        rating.match_id = match_id
        rating.comment = comment
        rating.score = score
        rating.user_id = user.id

        try {
            await rating.save()
            return response.send({status: 'Success', rating_id : rating.id})
        } catch (err) {
            return response.send({status : 'Fail', error: err.toString()})
        }
    }

    async checkPromotion({ auth, response, request, params }) {
        var errors = []
        try {
            const user = await auth.getUser()
            var code;
            var redeem;
            try {
                code = await Promo
                    .query()
                    .where('name',request.body.name)
                    .with('users')
                    .fetch()
                code = code.toJSON()[0]
            } catch (err) {
                errors.push(err.toJSON())
            }
            try {
                redeem = await AssetBundle
                    .query()
                    .whereHas('bundle',(b) => {
                        b.where('provider_id',params.sp_id)
                    })
                    .where('redeem_code',request.body.name)
                    .with('bundle')
                    .with('used_bundles')
                    .fetch()
                redeem = redeem.toJSON()[0]
            } catch (err) {
                errors.push(err.toString())
            }
            if (redeem) {
                if (redeem.used_bundles.length < redeem.bundle.code_limits) {
                    return response.send(
                        { status: 'Success',
                        promotion_id: null,
                        asset_bundle_id : redeem.id, 
                            var : {
                                type : 'percent',
                                value : 100
                            }
                        })
                } else {
                    return response.send({ status: 'Fail', msg: 'Promotion at limits'})
                }
            } else {
                if (code) {
                    const matches = await Match
                        .query()
                        .whereHas('promotion',(pr)=> {
                            pr.whereIn('id',[code.id])
                            pr.where('user_id',user.id)
                        })
                        .fetch()
                        
                    const promotion = code
                    const limit = promotion.total_use
                    const slot = promotion.user_limit
                    const used = matches.toJSON().length
    
                    if ((promotion.users.length < limit) && (used < slot)) {
                        let use = new MyPromo()
                        use.promotion_id = promotion.id
                        use.user_id = user.id
    
                        if (promotion.users.filter(use => use.id == user.id).length == used) {
                            await use.save()
                        }
    
                        return response.send({ status: 'Success', promotion_id : promotion.id, var : {
                            type : promotion.type,
                            value : promotion.value
                        }})
    
                    } else {
                        return response.send({ status: 'Fail', msg: 'Promotion at limits'})
                    }
                } else {
                    return response.send({ status: 'Fail', msg: 'Promotion not found or expired'})
                }
            }

        } catch (err) {
            errors.push(err.toString())
            return response.status(500).send({ status: 'fail', error: errors.toString()})
        }
    }

    async beMember ({ auth, response, params}) {
        const user = await auth.getUser()
        try {
            let member = new Member()
            member.user_id = user.id
            member.provider_id = params.sp_id
            await member.save()

            return response.send({ status: 'Success', member: member.id})
        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }

    async unMember ({ auth, response, params}) {
        const user = await auth.getUser()
        try {
            const member = await Member
                            .query()
                            .where('user_id',user.id)
                            .where('provider_id',params.sp_id)
                            .delete()

            return response.send({ status: 'Success', member: member.id})
        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
}

module.exports = UserController

'use strict'

const User = use('App/Models/User')
const Match = use('App/Models/Match')


class SPsiteController {

    //Check if user is registered, then create or get user
    async checkToRegis({ request, response, auth }) {
        const { fullname,email,phone_number } = request.body
        var result = []

        try {
            let userMail = await User.findBy('email',email)

            if (userMail) {
                let token = await auth.generate(userMail)
                result.push({user: userMail, token:token, found:'email'})
            }

        } catch (err) {}

        try {
            let userName = await User.findBy('fullname',fullname)

            if (userName) {
                let token = await auth.generate(userName)
                result.push({user: userName, token:token, found:'email'})
            }

        } catch (err) {}

        try {
            let userPhone = await User.findBy('phone_number',phone_number)

            if (userPhone) {
                let token = await auth.generate(userPhone)
                result.push({user: userPhone, token:token, found:'phone_number'})
            }

        } catch (err) {}

        try {
            let userPhone_preRegis = await User.findBy('phone_number','p'+phone_number)

            if (userPhone_preRegis) {
                let token = await auth.generate(userPhone_preRegis)
                result.push({user: userPhone_preRegis, token:token, found:'phone_number'})
            }

        } catch (err) {}
        
        if (result.length > 0) {
            return response.send({status: 'registered', user:result})
        } else {
            try {
                let user = new User()
                user.fullname = fullname
                user.password = 'p'+phone_number
                user.email = email
                user.phone_number = 'p'+phone_number
                user.pre_regis = true

                await user.save()
                let token = await auth.generate(user)

                return response.send({ status: 'pre-register', user:user, token:token })
            } catch (err) {
                return response.send({ status: 'fail to register', error:err })
            }
        }
    }

    //Create match from user_id and court_id
    async failPayment({ request, response, auth, params }) {
        const match = await Match.find(params.id)
        const uid = await auth.getUser()

        if (match.user_id == uid.id) {
            try {
                if (request.body.cancel) {
                    await match.merge(request.body)
                    await match.save()

                    return response.send({status: 'success', 'canceled':match})
                } else {
                    return response.send({status : 'fail', error:'cancel Only!'})
                }
            } catch (err) {
                return response.send({status : 'fail', error:err})
            }
        } else {
            return response.send('== Not Authorized ==')
        }
    }
}

module.exports = SPsiteController

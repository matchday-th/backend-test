'use strict'

const User = use('App/Models/User')
const UserLog = use('App/Models/UserLog')
const UserCredential = use('App/Models/UserCredential')

class CoreUserController {
    async genToken_google ({ response, request, auth }) {
        const { 
            email,
            picture,
            given_name,
            family_name,
            locale,
            sub, uid  } = request.body
        try {
            const user = await User.findBy('email', email)
            if (user) {
                if (user.phone_number.length == 10) {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send({status: 'success', token:token, phone_verify: true })
                } else {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send({status: 'success', token:token, phone_verify: false })
                }
            } else {
                var password = sub? sub:uid
                const user = await User.create({
                    email: email,
                    phone_number: password,
                    password: password,
                    firstname: given_name,
                    lastname: family_name,
                    fullname: `${given_name} ${family_name}`,
                    avatar: picture,
                    lang: locale,
                })
                const user_cred = await UserCredential.create({
                    user_id: user.id,
                    auth_type: 'google',
                    auth_id: password
                })
                if (user && user_cred) {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send(
                        { 
                            status: 'success',
                            token: token,
                            registered: user.id,
                            method: { 
                                auth_id: user_cred.id,
                                method: user_cred.auth_type
                            }
                        })
                }
            }
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error:err.toString()})
        }
    }

    async genToken_facebook ({ response, request, auth }) {
        var { 
            email,
            picture,
            first_name,
            last_name,
            id,
            phone_number  } = request.body
        try {
            const user = await User.findBy('email', email)
            if (user) {
                if (user.phone_number.length == 10) {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send({status: 'success', token:token, phone_verify: true })
                } else {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send({status: 'success', token:token, phone_verify: false })
                }
            } else {
                const user = await User.create({
                    email: email.replace('/','').replace('u0040','@'),
                    phone_number: phone_number,
                    password: phone_number,
                    firstname: first_name,
                    lastname: last_name,
                    fullname: `${first_name} ${last_name}`,
                    avatar: picture.data.url
                })
                const user_cred = await UserCredential.create({
                    user_id: user.id,
                    auth_type: 'facebook',
                    auth_id: id
                })
                if (user && user_cred) {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send(
                        { 
                            status: 'success',
                            token: token,
                            registered: user.id,
                            method: { 
                                auth_id: user_cred.id,
                                method: user_cred.auth_type
                            }
                        })
                }
            }
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error:err.toString()})
        }
    }

    async genToken_apple ({ response, request, auth }) {
        var { 
            email,
            avatar,
            firstname,
            lastname,
            apple_id,
            phone_number  } = request.body
        try {
            await UserLog.create({request_body: request.body})
            const user = await User.findBy('email', email)
            if (user) {
                if (user.phone_number.length == 10) {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send({status: 'success', token:token, phone_verify: true })
                } else {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send({status: 'success', token:token, phone_verify: false })
                }
            } else {
                const user = await User.create({
                    email: email.replace('/','').replace('u0040','@'),
                    phone_number: phone_number,
                    password: phone_number,
                    firstname: firstname,
                    lastname: lastname,
                    fullname: `${firstname} ${lastname}`,
                    avatar: avatar.data.url
                })
                const user_cred = await UserCredential.create({
                    user_id: user.id,
                    auth_type: 'apple',
                    auth_id: apple_id
                })
                if (user && user_cred) {
                    const token = await auth.authenticator('UserMail').generate(user)

                    return response.send(
                        { 
                            status: 'success',
                            token: token,
                            registered: user.id,
                            method: { 
                                auth_id: user_cred.id,
                                method: user_cred.auth_type
                            }
                        })
                }
            }
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error:err.toString()})
        }
    }
}

module.exports = CoreUserController

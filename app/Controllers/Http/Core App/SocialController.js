'use strict'

const User = use('App/Models/User')
const Database = use('Database')
const Friend = use('App/Models/Friend')

class SocialController {
    async index ({ response, request, auth }) {
        const user = await auth.getUser()
        const friend_id = await Friend
            .query()
            .where('user_id', user.id)
            .where('accept',1)
            .select('friend_id')
            .fetch()

        const friends = await User
            .query()
            .whereIn('id',friend_id.toJSON().map(f => f=f.friend_id))
            .fetch()

        const res = friends.toJSON().map(u => u = {
            id: u.id,
            fullname: u.fullname,
            firstname: u.firstname,
            lastname: u.lastname,
            avatar: u.avatar
        })

        return response.send(res)
    }

    async show ({ response, request, params, auth }) {
        const user = await auth.getUser()
        var friends; //Final Result

        try {
            if (params.id == 'in-coming') {
                const friend_id = await Friend
                    .query()
                    .where('friend_id', user.id)
                    .where('accept',0)
                    .select('user_id')
                    .fetch()

                friends = await User
                    .query()
                    .whereIn('id',friend_id.toJSON().map(f => f=f.user_id))
                    .fetch()
                
            } else if (params.id == 'out-going') {
                const friend_id = await Friend
                    .query()
                    .where('user_id', user.id)
                    .where('accept',0)
                    .select('friend_id','accept')
                    .fetch()

                friends = await User
                    .query()
                    .whereIn('id',friend_id.toJSON().map(f => f=f.friend_id))
                    .fetch()
            }

            const res = friends.toJSON().map(u => u = {
                id: u.id,
                fullname: u.fullname,
                firstname: u.firstname,
                lastname: u.lastname,
                avatar: u.avatar,
            })

            return response.send(res)
        } catch (err) {
            console.log(err);
            return response.send({error: 'bad parameter'})
        }
    }

    async update ({ response, request, params, auth }) {
        const user = await auth.getUser()
        const checkUser = await Database
            .select('*')
            .from('friends')
            .where({'user_id':params.id})
            .orWhere({'friend_id':params.id,'user_id':user.id})

        try {
            if (checkUser.length > 0) {
                //Update Accept
                const friend = await Friend.find(checkUser[0].id)
                await friend.merge((friend.toJSON().accept == 0? 1:0))
                await friend.save()

                return response.send({ status: 'success', result: {
                    method: 'accecpt'
                }})
            } else {
                //Create Friend
                let friend = new Friend()
                friend.user_id = user.id
                friend.friend_id = params.id

                await friend.save()
                return response.send({ status: 'success', result: {
                    method: 'created'
                }})
            }
        } catch (err) {
            console.log(err);
            return response.send({status: 'fail', error: err.toString()})
        }
    }

}

module.exports = SocialController

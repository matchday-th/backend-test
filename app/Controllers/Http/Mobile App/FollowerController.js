'use strict'

const Follower = use('App/Models/Friend')
const Database = use('Database')
const User = use('App/Models/User')

class FollowerController {

    async checkFollowing ({params, response}) {
        const fols = params
        const followers = await Database
                        .select('*')
                        .from('friends')
                        .where({'friend_id':fols.id})
        
        let room_ar = []
        followers.forEach( user => {
        room_ar.push(user.user_id)
        });
            
        let users = await User
                    .query()
                    .whereIn('id',room_ar)
                    .with('friends')
                    .fetch()

        return response.send(users)
    }

    async checkFollower ({params, response}) {
        const fols = params
        const followers = await Database
                        .select('*')
                        .from('friends')
                        .where({'user_id':fols.id})
        
        let room_ar = []
        followers.forEach( user => {
        room_ar.push(user.friend_id)
        });
            
        let users = await User
                    .query()
                    .whereIn('id',room_ar)
                    .with('friends')
                    .fetch()

        let result = users.toJSON().map(u => {
            u.friend_status = (u.friends.filter(f => f.friend_id == params.id).length > 0)? true:false
            return u
        })

        return response.send(result)
    }

    async store ({ request, response, auth, params}){
        const uid = await auth.getUser()
        const id = params.id

        let fol = new Follower()
        fol.user_id = id
        fol.friend_id = uid.id

        await fol.save()
        return response.send({"added":fol})
    }

    async destroy ({ params, response,auth }){
        const id  = await auth.getUser()
        const user = params.id
        try {
        await Database
            .from('friends')
            .where({'user_id':user,'friend_id':id.id})
            .del()
        } catch (err) { console.log(err);}
    
        return response.send('== Unfriended ==')
    }
}

module.exports = FollowerController

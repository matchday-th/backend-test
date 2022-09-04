'use strict'

const { query } = require("express")

const User = use('App/Models/User')
const Room = use('App/Models/Room')
const UserUuid = use('App/Models/UserUuid')

class ChatController {
    async checkToPushNotification({response, auth,params}){
        try{
            const user = await auth.getUser()
           
            const room = await Room
            .query()
            .where('match_id',params.id)
            .where('accept',true)
            .fetch()
            
            var user_ids = room.toJSON().filter(obj => obj.user_id !=user.id).map(obj => obj.user_id)
            user_ids.push(params.userid)

            const user_uuid = await UserUuid
            .query()
            .whereIn('user_id',user_ids)
            .where('is_login',true)
            .where('user_id','!=',user.id)
            .fetch()

             let result = user_uuid.toJSON();
             response.send(result)
        }catch(err){
            console.log(err)
            response.send(err)
        }
    }
}

module.exports = ChatController

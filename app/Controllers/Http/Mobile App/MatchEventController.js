'use strict'

const moment = use('moment')
const Match = use('App/Models/Match')

class MatchEventController {
    async homeEvent({ response, request }) {
        let now = moment().subtract(15,'minutes').toDate()
        try {
            const limit = request.get().limit
            const lat = request.get().lat
            const lng = request.get().lng
            
            const matches = await Match
                .query()
                .where('room_switch',1)
                .where('cancel',0)
                .whereHas('court.court_type.provider_sport.provider',(sp)=> {
                    sp.where('public',0)
                })
                .with('court.court_type.provider_sport',(bd)=>{
                    bd.with('sport')
                    bd.with('provider')
                })
                .with('user')
                .with('preference.roles')
                .with('rooms',(sp)=>{
                    sp.where('accept',1)
                    sp.with('user')
                })
                .where('time_start','>=',now)
                .pick(limit? limit:5)

            return response.send(matches)
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = MatchEventController

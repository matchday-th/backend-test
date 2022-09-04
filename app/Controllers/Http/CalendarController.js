const { Mutator } = require("./Utility")

const Match = use('App/Models/Match')
const Court = use('App/Models/Court')

class CalendarController {
    async matches ({ response, request, params }) {
        try {
            const { time_start, time_end } = request.body
            const sp_id = await Mutator.sp_idFromUrl(params.sp_id)
            
            const courts = await Court
                        .query()
                        .whereHas('court_type.provider_sport',(ps)=> {
                            ps.where('provider_id',sp_id)
                        })
                        .with('matches', (match) => {
                            match.where(function() {
                                this.whereBetween('time_start', [time_start, time_end])
                                this.orWhereBetween('time_end', [time_start, time_end])
                                this.orWhere(function () {
                                    this.where('time_start', '<=', time_start)
                                    this.where('time_start', '<=', time_end)
                                    this.where('time_end', '>=', time_start)
                                    this.where('time_end', '>=', time_end)
                                })
                            })
                            match.where('cancel', 0)
                            match.with('user')
                            match.with('court.court_type.provider_sport.sport')
                        })
                        .fetch()

            var matches = []
            courts.toJSON().map(court => {
                court.matches.map(match => {
                    let name;
                    if (match.user) {
                        name = match.user.fullname;
                    } else {
                        name = match.description;
                    }
                    matches.push({
                        id: match.id,
                        title: name,
                        start: match.time_start,
                        end: match.time_end,
                        resourceId: match.court_id,
                        extendedProps: {
                            sport: match.court.court_type.provider_sport.sport
                        }
                        })
                })
            })

            return response.send(matches)
        } catch (err) {
            console.log(err);
            return response.send(`provider not found`)
        }
    }

    async resources ({ response, params }) {
        const courts = await Court
                    .query()
                    .whereHas('court_type.provider_sport',(ps)=> {
                        ps.where('provider_id',params.sp_id)
                    })
                    .with('court_type.provider_sport.sport')
                    .fetch()
        
        return response.send(courts)
    }
}

module.exports = CalendarController

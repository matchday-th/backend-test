'use strict'

const Provider = use('App/Models/Provider')
const Court = use('App/Models/Court')
const Database = use('Database')
const Utility = require('../Utility.js')
const Helper = require('../Helper.js')
const moment = use('moment')


class CoreProviderController {
    async homeSP({ response, request }) {
        try {
            const limit = request.get().limit
            const lat = request.get().lat
            const lng = request.get().lng

            const provider = await Provider
                .query()
                .where('available', 1)
                .where('hidden_app', 0)
                .whereNotNull('lat')
                //where lat lng in distance
                //-distance = first 5
                .with('provider_sports', (bd) => {
                    bd.with('sport')
                    bd.with('court_types.courts')
                })
                .with('photos')
                .with('ratings')
                .pick(limit? limit:5)

            return response.send(provider)
        } catch (err) {
            console.log(err);
        }
    }

    async indexSP ({ response }) {
        try {
            const provider = await Provider
                .query()
                .where('hidden_app', 0)
                .whereNotNull('lat')
                .whereNotNull('phone_number')
                .whereHas('provider_sports.sport')
                .with('provider_sports', (bd) => {
                    bd.with('sport')
                    bd.with('court_types.courts')
                })
                .with('facilities')
                .with('photos')
                .with('bus_times')
                .with('ratings')
                .fetch()

            return response.send(provider)
        } catch (err) {
            return response.send(err.toString())
        }
    }

    async filterSP({response, request}) {
        const query_params = request.get()
        var result = await Utility.Query.query_provider(query_params.page, query_params)

        return response.send(result.data)
    }

    async searchSP({response, request}) {
      const query_params = request.get()
      var result = await Utility.Query.query_provider(query_params.page, query_params)

      return response.send(result)
  }

    async freeCourt({ response, request, params }) {
        var { courts, time_start, time_end, duration_type } = request.body
        time_start = Utility.Validator.matchTimeInput(time_start, time_end)
        time_end = Utility.Validator.checkDay_timeEnd(time_start, time_end)

        const freeCourts = await Court
                        .query()
                        .whereIn('id',courts)
                        .whereDoesntHave('matches', (match) => {
                            match.where('cancel', 0)
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
                        })
                        .with('court_type',(ct) => {
                            ct.with('fixed_times')
                            ct.with('time_slots.slot_prices')
                        })
                        .fetch()

        var court_prices = freeCourts.toJSON()
        const provider = await Provider.find(params.id)
        const getSports = await provider
            .provider_sports()
            .with('services')
            .with('bus_times')
            .with('sport')
            .with('court_types', (ct) => {
                ct.with('courts', (sp) => {
                    sp.whereIn('id', court_prices.map(court => court.id))
                })
                ct.with('period_price')
                ct.with('fixed_times')
                ct.with('time_slots.slot_prices')
            })
            .fetch()
        
        var court_avilables = Helper.getCourtAvailable(court_prices, time_start, time_end)
        var provider_sport = getSports.toJSON()
        const output = {
            free: provider_sport.map(sport => {
                sport.court_types.map(court_type => {
                    court_type.available = court_avilables.filter((court)=> court.court_type_id==court.court_type_id).length>0?true:false
                    court_type.courts.map(court => {
                        court.duration = Helper.getDuration({ time_start, time_end },duration_type? duration_type:'hours')
                        court.price = Helper.cal_PeriodPrice({ 
                            period_prices: court_type.period_price,
                            time_start,
                            time_end,
                            price_court: court_type.share_court? court_type.price:court.price,
                            time_slots: court_type.time_slots
                        })/court.duration
                        court_type.price = court.price
                        return court
                    })

                })
                return sport
            }),
            sports: checkTime(getSports)
        }

        function checkTime(array) {
            let day = moment(time_start, 'YYYY-MM-DD HH:mm').format('e')
            let pass = array.toJSON()
            let time = pass.map(sport => {
                let filtered = sport.bus_times.filter(slot => {
                    slot.days = slot.days.split(',').map(n => parseInt(n, 10))
                    let today = slot.days.findIndex((t) => t == day)
                    if (today != -1) {
                        if (parseInt(slot.close_time, 10) > 23) {
                            slot.close_time = `${parseInt(slot.close_time, 10) - 24}:00`
                        }
                        return slot
                    }
                })

                return filtered[0]
            }).filter(p => p != null)

            let status = time.map(bus => {
                try {
                    let check_start = moment(time_start, 'YYYY-MM-DD HH:mm').unix()
                    let check_end = moment(time_end, 'YYYY-MM-DD HH:mm').unix()
                    let open = moment(`${moment(time_start, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD')} ${bus.open_time}`, 'YYYY-MM-DD HH:mm').unix()
                    let close = moment(`${moment(time_start, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD')} ${bus.close_time}`, 'YYYY-MM-DD HH:mm').unix()

                    let dayStart = moment(time_start, 'YYYY-MM-DD HH:mm').format('HH:mm')
                    let dayClose = moment(close, 'X').format('HH:mm')
                    if (parseInt(dayStart, 10) < 6 && parseInt(dayClose, 10) < 4) {
                        open = moment(open, 'X').subtract(1, 'days').unix()
                    }
                    if (close < open) {
                        close = moment(close, 'X').add(1, 'days').unix()
                    }


                    if ((check_end > open && check_end <= close) && (check_start >= open && check_start < close)) {
                        bus.status = true
                    } else {
                        bus.status = false
                    }

                } catch (err) {
                    console.log(err);
                }

                return bus
            })

            return status
        }

        return response.send(output)
    }
}

module.exports = CoreProviderController

const moment = use('moment')
const timeFormat = 'YYYY-MM-DD HH:mm:ss'
const monthFormat = 'YYYY-MM'
const dateFormat = 'YYYY-MM-DD'
const Price = use('App/Models/SlotPrice')
const CourtType = use('App/Models/CourtType')
const Court = use('App/Models/Court')

const Helper = {
    timeFormat: timeFormat,
    monthFormat: monthFormat,
    dateFormat: dateFormat,
    matchTimeInput (time_start, time_end) {
        var rule_1 = moment(time_end,timeFormat).diff(moment(time_start,timeFormat),'minutes')
        return (parseInt(rule_1,10)%30 == 0)? moment(time_start,timeFormat).add(1,'minutes').format(timeFormat):time_start
    },
    async addPeriodPrice (court_id, time_start, time_end, share_court, court_type_id) {
        /* Get SlotPrice from Court */
        time_start = Helper.matchTimeInput(time_start, time_end)
        const price = await Price
            .query()
            .whereHas('time_slot',(ts)=>{
                ts.whereHas('court_type',(ct)=>{
                    ct.whereHas('courts',(c)=> {
                         c.where('id',court_id)
                    })
                })
            })
            .with('time_slot',(ts)=>{
                ts.with('court_type',(ct)=> {
                    ct.whereHas('courts',(c)=> {
                        c.where('id',court_id)
                    })
                    ct.with('courts')
                })
                ts.with('slot_prices')
            })
            .fetch()

            var prices = price.toJSON().map(({ time_slot }) => time_slot)
            var court_price = 0
            var free_hour = 0

            var court = await Court.find(court_id)
            await court.load('court_type')
            court = court.toJSON()
            free_hour = court.court_type.free_hour
            court_price = court.court_type.price

            if (share_court) {
                if(!court_type_id){
                    const {sub_court_type_id} = await Court.find(court_id)
                    court_type_id = sub_court_type_id
                }
                const courtType = await CourtType.find(court_type_id)
                court_price = courtType.price

                await courtType.load('time_slots.slot_prices')
                prices = courtType.toJSON().time_slots
            }
         
            const result = Helper.cal_PeriodPrice({
                price_court: court_price,
                time_start,
                time_end,
                time_slots: prices,
                free_hour: free_hour
            })
            return result
    },
    cal_PeriodPrice({ period_prices, price_court, time_start, time_end, time_slots, free_hour }) {
        time_start = Helper.matchTimeInput(time_start, time_end)

        /* Price DOW Selector */
        var day_ofStart;
        var day_ofEnd;
        var time_prices = time_slots? Helper.convert_slot_prices(time_slots):period_prices
        var prices = time_prices.filter(pp => {
            /* Check TimeInput  */
            const timeStart = moment(time_start,timeFormat).subtract(1,'minutes').unix()
            const timeEnd = moment(time_end,timeFormat).unix()
            const pp_startTime = (typeof pp.start_time == "number")? pp.start_time: moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+pp.start_time,timeFormat).unix()
            const pp_endTime = (typeof pp.end_time == "number")? pp.end_time:(moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+pp.end_time,timeFormat).unix() <= pp_startTime)?
                moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+pp.end_time,timeFormat).add(1,'days').unix():
                moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+pp.end_time,timeFormat).unix()
            
            day_ofStart = moment(timeStart, 'X').format('e')
            day_ofEnd = moment(timeEnd, 'X').format('e')

            return Helper.timeRangeFilter(pp, timeStart, timeEnd, pp_startTime, pp_endTime)
        }).filter(dow => dow.days.split(',').includes(day_ofStart) || dow.days.split(',').includes(day_ofEnd))


        var timeStart = moment(time_start,timeFormat).subtract(1,'minutes').unix()
        const timeEnd = moment(time_end,timeFormat).unix()
        var total_dur = moment(timeEnd,'X').diff(moment(timeStart,'X'),'hours',true)
        /* only work when have period price */
        if (prices.length > 0) {
            const court_price = price_court

            /* Price Time Selector & Calculation */
            var timeStart = moment(time_start,timeFormat).subtract(1,'minutes').unix()
            const timeEnd = moment(time_end,timeFormat).unix()
            var total_dur = moment(timeEnd,'X').diff(moment(timeStart,'X'),'hours',true)

            var addedPrices = []
            for (var i=0;i<prices.length;i++) {
                var dur = 0;
                var cal_price;
                const period_price = prices[i].var_price

                /* when start outside period price */
                if (!(timeStart > prices[i].end_time) && !(timeEnd < prices[i].start_time)) {
                    if (timeStart > prices[i].start_time) {
                        dur = (timeEnd > prices[i].end_time)? 
                            moment(prices[i].end_time,'X').diff(moment(timeStart,'X'),'hours',true):
                            moment(timeEnd,'X').diff(moment(timeStart,'X'),'hours',true)
                    } else {
                        dur = (timeEnd > prices[i].end_time)? 
                            moment(prices[i].end_time,'X').diff(moment(prices[i].start_time,'X'),'hours',true):
                            moment(timeEnd,'X').diff(moment(prices[i].start_time,'X'),'hours',true)
                    }

                    if (dur > 0) {
                        if(free_hour){
                            cal_price = (prices[i].var_type)? (court_price+((period_price*court_price)/100)):time_slots? (prices[i].var_price):(court_price+period_price)
                        }else{
                            cal_price = (prices[i].var_type)? dur*(court_price+((period_price*court_price)/100)):time_slots? dur*(prices[i].var_price):dur*(court_price+period_price)
                        }
                        addedPrices.push(cal_price)
                        timeStart = prices[i].end_time
                        total_dur = total_dur-dur
                    }
                }
            }
            
            /* catch non period prices */
            if (total_dur > 0) {
                addedPrices.push(total_dur*court_price)
            }

            /* sum prices */
            return (addedPrices.length>1)? addedPrices.reduce((a,b)=> a+b):addedPrices[0]
        /* when dont have period price */
        } else {
            if(free_hour){
                return parseInt(price_court,10)
            }else{
                const timeStart = moment(time_start,timeFormat).subtract(1,'minutes').unix()
                const timeEnd = moment(time_end,timeFormat).unix()
                var total_dur = moment(timeEnd,'X').diff(moment(timeStart,'X'),'hours',true)
                return parseInt(price_court,10)*total_dur
            }
        }
    },
    getDuration({time_start, time_end}, type) {
        time_start = moment(time_start,timeFormat).subtract(1,'minutes').unix()
        time_end = moment(time_end,timeFormat).unix()
        return moment(time_end,'X').diff(moment(time_start,'X'),type,true)
    },
    timeRangeFilter(pp, timeStart, timeEnd, pp_startTime, pp_endTime) {
        if (timeStart < pp_endTime && timeEnd > pp_startTime) {
            pp.start_time = pp_startTime
            pp.end_time = pp_endTime
            return true
        } else {
            return false
        }
    },
    getCourtAvailable(freeCourts, time_start, time_end){
          /* Price DOW Selector */
          var day_ofStart;
          var day_ofEnd;
  
          freeCourts = freeCourts.filter( court => {
  
              const timeStart = moment(time_start,timeFormat).subtract(1,'minutes').unix()
              const timeEnd = moment(time_end,timeFormat).unix()
              day_ofStart = moment(timeStart, 'X').format('e')
              day_ofEnd = moment(timeEnd, 'X').format('e')
  
          var time_slots = court.court_type.time_slots.filter(dow => dow.days.split(',').includes(day_ofStart) || dow.days.split(',').includes(day_ofEnd))
          time_slots = time_slots.filter(ts=>{
                  const ts_startTime = moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+ts.open_time,timeFormat).unix() 
                  const hour_end = ts.close_time.split(':')[0]
                  const minute_end = ts.close_time.split(':')[1]
                  const ts_endTime = (hour_end >=24)?
                      moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+(hour_end-24)+':'+minute_end,timeFormat).add(1,'days').unix():
                      moment(moment(time_start,timeFormat).format('YYYY-MM-DD')+' '+ts.close_time,timeFormat).unix()   
                  return Helper.timeRangeFilter(ts, timeStart, timeEnd, ts_startTime, ts_endTime)
              })
          return  time_slots.length> 0 ? true : false
          })
        return freeCourts
    },
    async joinPeriodPrice(court_types, time_start, time_end) {
        return Promise.all(court_types.toJSON().map(async (type) => {
            type.courts = await Promise.all(type.courts.map(async (court) => {
                court.added_price = await Helper.addPeriodPrice(court.id, time_start, time_end)
                return court
            }))
            return type
        }))
    },
    isInRange(mathes,[start,end]) {
        if ((moment(mathes.time_start,timeFormat).unix() >= moment(start,timeFormat).unix()) && (moment(mathes.time_start,timeFormat).unix() <= moment(end,timeFormat).unix())) {
            return true
        } else {
            return false
        }
    },
    getDistance(a, b) {
        function deg2rad(deg) {
            return deg * (Math.PI / 180)
        }
    
        function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
            try {
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2 - lat1); // deg2rad below
                var dLon = deg2rad(lon2 - lon1);
                var a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                var d = R * c; // Distance in km
                d = parseFloat(d).toFixed(1);
                d = parseFloat(d)
    
            return d;
    
            } catch (err) {
                console.log(err);
            }
        }
    
        try {
            let pitch = {
                lat: parseFloat(a),
                lng: parseFloat(b)
                }
            let user = Session.get('user_location').param
    
            if (user) {
                let distance = getDistanceFromLatLonInKm(user.lat, user.lng, pitch.lat, pitch.lng)
                Session.set('distance',true)
    
                return distance
            } else {
                return null
            }
    
        } catch (err) {
                console.log(err);
        }
    },
    convert_slot_prices(time_slots) {
        var prices = []
        time_slots.forEach(ts => {
            ts.slot_prices.map(p => {
                p.days = ts.days
                prices.push(p)
            })
        })
        return prices
    }
}

module.exports = Helper
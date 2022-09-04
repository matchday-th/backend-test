const Utility  = require('./Utility.js');
const Helper  = require('./Helper.js');
const moment = use('moment')

const Provider = use('App/Models/Provider')
const ScoreBoardSetting = use('App/Models/ScoreBoardSetting')
const ScoreBoard = use('App/Models/ScoreBoard')


const ScoreBoardHelper = {
    Validated: {
        get_provider_banned_ids(banned_sp){
            var ids = []
                if(banned_sp) ids = banned_sp.split(",")
            return ids
        },
        get_payment_type(match){
            const payment = JSON.parse(match.payment)
            return payment.type
        },
        provider_ranking(providers, setting){
            providers.forEach(sp=>{
                sp.online_price = Calculated.get_online_price(sp.matches)
                sp.used_hour = Calculated.get_used_hour(sp.matches)
                sp.total_court = Calculated.get_total_court(sp.provider_sports)
                sp.total_hour = Calculated.get_total_hour(sp.provider_sports)
                sp.rate_online = Calculated.get_rate_create_book(sp.used_hour.online_hour, sp.total_court, sp.total_hour)
                sp.rate_offline = Calculated.get_rate_create_book(sp.used_hour.offline_hour, sp.total_court, sp.total_hour)
                sp.rate_all =  parseFloat((setting.payment_method==1? sp.rate_online : sp.rate_online+sp.rate_offline).toFixed(2))
            })
           
            providers.sort((a,b)=>b.rate_all-a.rate_all)
            
            const provider = providers.map(sp=>{
                const {id, fullname, used_hour, total_court, total_hour, online_price, rate_online, rate_offline, rate_all,} = sp
                return {
                    id,
                    fullname,
                    sports: sp.provider_sports.map(sport=>sport.sport),
                    used_hour,
                    total_court,
                    total_hour,
                    online_price,
                    rate_online, 
                    rate_offline, 
                    rate_all,
                }
            })
          return provider
        }
    },
    Calculated: {
        getDuration({time_start, time_end}, type) {
            return moment(time_end,'X').diff(moment(time_start,'X'),type,true)
        },
        get_total_court(provider_sports){
            var amount_court = provider_sports.reduce((a,b)=>(a + b.courts.length), 0)
            return amount_court
        },
        get_used_hour(matches){
            const match_paided = matches.filter(match=> Utility.Mutator.getMatchStatus(match) == 'paid' )
            match_paided.map(match=>{
                match.hour = Helper.getDuration({time_start: match.time_start,time_end: match.time_end},'hours')
            })

            const match_offline = match_paided.filter(match=>ScoreBoardHelper.Validated.get_payment_type(match)=='cash')
            const match_online = match_paided.filter(match=>ScoreBoardHelper.Validated.get_payment_type(match)=='online')

            const offline_hour = match_offline.reduce((a,b)=> a+b.hour, 0)
            const online_hour = match_online.reduce((a,b)=> a+b.hour, 0)
            const total_hour = offline_hour + online_hour
            return {offline_hour, online_hour, total_hour}
        },
        get_total_hour(provider_sports){
            let now = moment()
            var time_slots = []
            var total_hour = 0
            provider_sports.forEach(sp=>{
                sp.court_types.forEach(ct=>{
                     ct.time_slots.forEach(time_slot => {
                        time_slots.push(time_slot)
                     }); 
                })
            })

            time_slots.forEach(ts=>{
                const ts_startTime = moment(moment(now,Helper.timeFormat).format('YYYY-MM-DD')+' '+ts.open_time,Helper.timeFormat).unix()
                const hour_end = ts.close_time.split(':')[0]
                const minute_end = ts.close_time.split(':')[1]
                const ts_endTime = (hour_end >=24)?
                    moment(moment(now,Helper.timeFormat).format('YYYY-MM-DD')+' '+(hour_end-24)+':'+minute_end,Helper.timeFormat).add(1,'days').unix():
                    moment(moment(now,Helper.timeFormat).format('YYYY-MM-DD')+' '+ts.close_time,Helper.timeFormat).unix()

                var duration = this.getDuration({time_start: ts_startTime,time_end: ts_endTime,},'hours')
                total_hour = total_hour+duration
            })
            return total_hour
        },
        get_rate_create_book(total_used_hour, total_court, total_hour){
            var rate = (total_used_hour/(total_court*total_hour))*100
                rate = rate ? rate : 0
           return parseFloat(rate.toFixed(2))
        },
        get_online_price(matches){
            const match_paided = matches.filter(match=> Utility.Mutator.getMatchStatus(match) == 'paid' && ScoreBoardHelper.Validated.get_payment_type(match)=='online' )
            return match_paided.reduce((a,b)=>a+b.total_price, 0)
        },
        get_prize(online_price, total_prize, payment_method){
            var new_total_prize = total_prize
            const max_price = 2000
            const percent_income = 20
            var prize = 0

            if(new_total_prize>0){
                if(payment_method == 1){
                    if(online_price>0){
                        prize = ( percent_income *online_price) / 100
                        new_total_prize = new_total_prize-prize
                    }else{
                        prize = max_price 
                        new_total_prize = new_total_prize-prize
                    }
                }else{
                    prize = new_total_prize < max_price ? new_total_prize : max_price
                    new_total_prize = new_total_prize-prize
                }
            }

        return {prize,new_total_prize}
        },
        get_my_score(ranking, sp_id){
            const my_score = ranking.filter(rank=>rank.id==sp_id)[0]
            const index = ranking.findIndex(rank=> rank.id==sp_id)

         const {fullname, used_hour, rate_online, rate_all, rate_offline} = my_score
            return {no:index+1, 
                fullname, 
                income_online: my_score.online_price, 
                used_hour, 
                rate_online, 
                rate_all,
                rate_offline}
        }
    }

}

const {Validated, Calculated} = ScoreBoardHelper

const ScoreBoardModule = {
    Query: {
        async get_setting(month){
            try{
                const setting = await ScoreBoardSetting
                                .query()
                                .where('at_month','like','%'+month+'%')
                                .fetch()              
                return setting.toJSON()[0]
            }catch(err){
                console.log(err)
                return {}
            }
        },
        async get_provider(setting, month){
            try{
                const provider = await Provider
                                .query()
                                .where('available', 1)
                                .whereNotIn('id', Validated.get_provider_banned_ids(setting.banned_sp))
                                .with('provider_sports',provider=>{
                                    provider.with('sport')
                                    provider.with('courts')
                                    provider.with('court_types.time_slots')
                                })
                                .with('matches',match=>{
                                    match.where('cancel',0)
                                    match.where('time_start','like','%'+month+'%')
                                    match.with('used_bundle')
                                    match.with('promotion')
                                    match.where(function(){
                                        if(setting.payment_method==1){
                                            this.where('payment','{"type":"online","payment_multi":true}')
                                            this.orWhere('payment','{"type":"online","payment_multi":false}')
                                        }else if(setting.payment_method==0){
                                            this.where('payment','{"type":"cash","payment_multi":false}')
                                        }
                                    })
                                })
                                .fetch()

                    
                return provider.toJSON()
            }catch(err){
                console.log(err)
                return []
            }

        },
        async score_board_month(month){
                const score_board = await ScoreBoard
                                    .query()
                                    .where('at_month','like','%'+month+'%')
                                    .with('provider.provider_sports.sport')
                                    .fetch()
                return score_board.toJSON()
        }
    },
    GetOrCreate: {
        async show_score(sp_id, month){
            const setting = await ScoreBoardModule.Query.get_setting(month)
            if(setting){
                const providers = await ScoreBoardModule.Query.get_provider(setting, month)
                const score_boards = await ScoreBoardModule.Query.score_board_month(month)
    
                const ranking = Validated.provider_ranking(providers, setting)
    
                const my_score = Calculated.get_my_score(ranking, sp_id)
                const score_board = await ScoreBoardModule.GetOrCreate.create_score(ranking, setting, month, score_boards)
    
                return {setting, my_score, score_board}
            }else{
                return {setting:{}, my_score:{},score_board:[]}
            }
        },
        async create_score(ranking, setting, month, score_boards){
            try{
                var total_prize = setting.total_prize
                ranking.map(provider=>{
                    const {prize, new_total_prize} = Calculated.get_prize(provider.online_price, total_prize, setting.payment_method)
                    total_prize = new_total_prize
                    provider.prize = prize 
                    return provider
                })

                if(score_boards.length>0){
                    for(var i = 0; i<score_boards.length; i++){
                        const target = await ScoreBoard.find(score_boards[i].id)
                            await target.merge({provider_id: ranking[i].id})
                            await target.save()

                        var foundIndex = ranking.findIndex(x => x.id == target.provider_id);
                        ranking[foundIndex].prize = target.prize  
                    }

                }
    
                if(score_boards.length<setting.limit){
                    const total = setting.limit
                    for(var i = 0; i<total; i++){
                        const create_score = {provider_id: ranking[i+score_boards.length].id, prize: ranking[i+score_boards.length].prize, at_month: month}
                        const score_board = await ScoreBoard.create(create_score)
                    }
                }else if(score_boards.length>setting.limit){
                    const target = score_boards.length-1
                    const total = target-setting.limit
                    for(var i = 0; i<total; i++){
                        const target = await ScoreBoard.find(score_boards[i+setting.limit].id)
                        await target.delete()
                    }
                }else{
    
                }

                return ranking.slice(0, setting.limit) 
            }catch(err){
                console.log(err)
            }
        },
    }

}
module.exports = ScoreBoardModule
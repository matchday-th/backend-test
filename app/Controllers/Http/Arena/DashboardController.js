'use strict'

const Pitch = use('App/Models/Provider')
const Database = use('Database')
const moment = use('moment')

class DashboardController {
    async varUser ({ request, response, auth, params }) {
        const date = moment(request.body.date).toDate()
        const timeStart = date
        const timeEnd = moment(date).add(1,'months').toDate()
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)
        
        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=>{
                            ct.with('matches',(mt)=>{
                                mt.whereBetween('time_start',[timeStart,timeEnd])
                                .with('court')
                                .with('user')
                                .with('rooms',(rm)=>{
                                    rm.where('accept','=',1)
                                    .with('user')
                                })
                            })
                        })
                        .fetch()
        
        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })

        let res = pro_sport[0].court_types
        let creator = []
        let joiner = []

        var i;
        for (i=0;i<res.length;i++) {
            let matches = res[i].matches
            matches.map(match => {
                if (match.user != null) {
                    creator.push(match.user.fullname)
                }
                if (match.rooms) {
                    match.rooms.map(room => {
                        if (room.user != null) {
                            joiner.push(room.user.fullname)
                        }
                    })
                }
            })
        }

        let allplayer = creator.concat(joiner);
        let dif = Array.from(new Set(allplayer))

        return response.send(dif.length)
    }

    async newUser ({ request, response, auth, params }) {
        const date = moment(request.body.date).toDate()
        const now = date
        const lastM = moment(date).add(1,'months')._d
        const last2m = moment(date).subtract(1,'months')._d
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)

        const matches_pre = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(mt)=>{
                                mt.whereBetween('time_start',[now,lastM])
                                .with('court')
                                .with('user')
                                .with('rooms',(rm)=>{
                                    rm.where('accept','=',1)
                                    .with('user')
                                })
                            })
                        })
                        .fetch()
        
        const matches_pas = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(mt)=>{
                                mt.whereBetween('time_start',[last2m,now])
                                .with('court')
                                .with('user')
                                .with('rooms',(rm)=>{
                                    rm.where('accept','=',1)
                                    .with('user')
                                })
                            })
                        })
                        .fetch()
        
        const pro_sport_pre = matches_pre.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res_pre = pro_sport_pre[0].court_types

        let creator_pre = []
        let joiner_pre = []

        var i;
        for (i=0;i<res_pre.length;i++) {
            let matches = res_pre[i].matches
            matches.map(match => {
                if (match.user != null) {
                    creator_pre.push(match.user.fullname)
                }
                if (match.rooms) {
                    match.rooms.map(room => {
                        if (room.user != null) {
                            joiner_pre.push(room.user.fullname)
                        }
                    })
                }
            })
        }

        let allplayer_pre = creator_pre.concat(joiner_pre);
        let dif_pre = Array.from(new Set(allplayer_pre))

        const pro_sport_pas = matches_pas.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res_pas = pro_sport_pas[0].court_types

        let creator_pas = []
        let joiner_pas = []

        var j;
        for (j=0;j<res_pas.length;j++) {
            let matches = res_pas[j].matches
            matches.map(match => {
                if (match.user != null) {
                    creator_pas.push(match.user.fullname)
                    match.rooms.map(room => {
                        if (room.user != null) {
                            joiner_pas.push(room.user.fullname)
                        }
                    })
                }
            })
        }

        let allplayer_pas = creator_pas.concat(joiner_pas);
        let dif_pas = Array.from(new Set(allplayer_pas))
        let num_user = dif_pre.length
        var num_old = 0
        
        if (dif_pas.length > 0) {
            var k;
            for (k=0;k<dif_pas.length;k++) {
                if(dif_pre.findIndex(n => n == dif_pas[k])) {
                    num_old++
                }
            }
            return response.send(num_user - num_old)
        } else {
            return response.send(0)
        }
    }

    async allMatches ({ request, response, auth, params }) {
        const timeStart = request.body.date
        const timeEnd = moment(timeStart,'YYYY-MM-DD HH:mm:ss').add(1,'months').format('YYYY-MM-DD HH:mm:ss')

        const sp = await auth.getUser()
        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(bd)=>{
                                bd.whereBetween('time_start',[timeStart,timeEnd])
                            })
                        })                        
                        .fetch()
                        
        let match = []
        matches.toJSON().map(sport => {
            sport.court_types.map(court_type => {
                match.push(court_type.matches.length)
            })
        })
        let sum = match.reduce((a,b) => a + b, 0)

        return response.send(sum)
    }

    async revenue ({ request, response, auth, params }) {
        const date = request.body.date
        const timeStart = date
        const timeEnd = moment(date).add(1,'months')._d
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)
        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(bd)=>{
                                bd.where('cancel',0)
                                bd.whereBetween('time_start',[timeStart,timeEnd])
                                bd.with('court')
                            })
                        })
                        .fetch()

        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })

        let res = pro_sport[0].court_types
        let price = []
        res.map(type => {
            type.matches.map(match => {
                if (match.total_price > 0) {
                    price.push(match.total_price)
                }else {
                    price.push(match.court.price)
                }
            })
        })
        let sum = price.reduce((a,b) => a + b, 0)
        let addComma = sum.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ","); 

        return response.send(addComma)
    }

    async sex ({ request, response, auth, params }) {
        const date = request.body.date
        const timeStart = date
        const timeEnd = moment(date).add(1,'months')._d
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)

        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(mt)=>{
                                mt.whereBetween('time_start',[timeStart,timeEnd])
                                .with('court')
                                .with('user')
                                .with('rooms',(rm)=>{
                                    rm.where('accept','=',1)
                                    .with('user')
                                })
                            })
                        })
                        .fetch()
        
        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res = pro_sport[0].court_types
        let creator = []
        let joiner = []

        var i;
        for (i=0;i<res.length;i++) {
            let matches = res[i].matches
            matches.map(match => {
                creator.push(match.user)
                match.rooms.map(room => {
                    joiner.push(room.user)
                })
            })
        }

        let allplayer = creator.concat(joiner);
        try {
            allplayer = allplayer.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                t.id === thing.id
                ))
            )} catch (err) {}

        let male = []
        let female = []
        let undif = []
        
        allplayer.map(user => {
            if (user) {
                if (user.sex == 'Male') {
                    male.push(user)
                } else if (user.sex == ' Female') {
                    female.push(user)
                } else {
                    undif.push(user)
                }
            }
        })

        let sex_obj = { male: male.length, female : female.length, undefined : undif.length }
        
        return response.send(sex_obj)
    }

    async age ({ request, response, auth, params }) {
        const date = request.body.date
        const timeStart = date
        const timeEnd = moment(date).add(1,'months')._d
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)

        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(mt)=>{
                                mt.whereBetween('time_start',[timeStart,timeEnd])
                                .with('court')
                                .with('user')
                                .with('rooms',(rm)=>{
                                    rm.where('accept','=',1)
                                    .with('user')
                                })
                            })
                        })
                        .fetch()
        
        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res = pro_sport[0].court_types
        let creator = []
        let joiner = []

        var i;
        for (i=0;i<res.length;i++) {
            let matches = res[i].matches
            matches.map(match => {
                creator.push(match.user)
                match.rooms.map(room => {
                    joiner.push(room.user)
                })
            })
        }

        let allplayer = creator.concat(joiner);
        try {
            allplayer = allplayer.filter((thing, index, self) =>
                index === self.findIndex((t) => (
                t.id === thing.id
                ))
            )} catch (err) {}
        
        let kid = []
        let child = []
        let teen = []
        let mid = []
        let adult = []
        let old = []
        let unknow = []
        allplayer.map(user => {
            if (user != null) {
                if (user.age < 11 && user.age != null) {
                    kid.push(user.age)
                } else if (user.age > 10 && user.age < 21) {
                    child.push(user.age)
                } else if (user.age > 20 && user.age < 31) {
                    teen.push(user.age)
                } else if (user.age > 30 && user.age < 41) {
                    mid.push(user.age)
                } else if (user.age > 40 && user.age < 51) {
                    adult.push(user.age)
                } else if (user.age > 50) {
                    old.push(user.age)
                } else {
                    unknow.push(user)
                }
            }
        })
        
        return response.send({ kid: kid.length,
                                child: child.length,
                                teen:teen.length,
                                mid:mid.length,
                                adult:adult.length,
                                old:old.length,
                                undefined: unknow.length})
    }

    async peakTime ({ request, response, auth, params }) {
        const date = request.body.date
        const timeStart = date
        const timeEnd = moment(date).add(1,'months')._d
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)
        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(bd)=>{
                                bd.whereBetween('time_start',[timeEnd,timeStart])
                            })
                        })
                        .fetch()

        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res = pro_sport[0].court_types
        let main = []
        res.map(court => {
            return court.matches.map(match => {
                let time = moment(match.time_start,'YYYY-MM-DD HH:mm:ss').subtract(1,'minutes').format('HH:mm')
                 main.push({ id : match.id, time_start : time })
            })
        })

        return response.send(main)
    }

    async promotions ({ request, response, auth, params }) {
        const date = request.body.date
        const timeStart = date
        const timeEnd = moment(date).add(1,'months').toDate()
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)
        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(bd)=>{
                                bd.whereBetween('time_start',[timeStart,timeEnd])
                                bd.whereNot('promotion_id',null)
                            })
                        })                        
                        .fetch()

        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res = pro_sport[0].court_types

        let count = res.map(court => {
            return court.matches.length
        })
        let sum = count.reduce((a,b) => a + b, 0)


        return response.send(sum)         
    }

    async canceled ({ request, response, auth, params }) {
        const date = request.body.date
        const timeStart = date
        const timeEnd = moment(date).add(1,'months').toDate()
        const check = await auth.getUser()
        const sp = await Pitch.find(check.id)
        const matches = await sp
                        .provider_sports()
                        .with('court_types',(ct)=> {
                            ct.with('matches',(bd)=>{
                                bd.whereBetween('time_start',[timeStart,timeEnd])
                                bd.where('cancel',1)
                            })
                        })                        
                        .fetch()

        const pro_sport = matches.toJSON().filter(ps => {
            if (params.sp != 'all') {
                return ps.id == params.sp
            } else {
                return ps
            }
        })
        let res = pro_sport[0].court_types

        let count = res.map(court => {
            return court.matches.length
        })
        let sum = count.reduce((a,b) => a + b, 0)


        return response.send(sum)         
    }
}

module.exports = DashboardController

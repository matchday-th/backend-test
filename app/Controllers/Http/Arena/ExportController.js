'use strict'

const moment = use('moment')
const Provider = use('App/Models/Provider')
const Match = use('App/Models/Match')

class ExportController {
    async myMatches({ request, response, auth, params }) {
        const sp = await auth.getUser()
        const { time_start, time_end } = request.body
        
        const now = moment().format('YYYY-MM-DD HH:mm:ss')
        let matches = await Match
            .query()
            .where('cancel',0)
            .whereHas('court.court_type.provider_sport',(ps)=> {
                ps.where('provider_id',sp.id)
            })
            .with('court.court_type.provider_sport',(ps)=> {
                ps.with('sport')
            })
            .with('user')
            .with('payments')
            .whereBetween('time_start',[time_start,time_end])
            .fetch()

        let result = matches.toJSON().map(m => {
            return {
                id: m.id,
                court: m.court.name,
                sport: m.court.court_type.provider_sport.sport.name,
                day: moment(m.time_start,'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY'),
                time_start: moment(m.time_start,'YYYY-MM-DD HH:mm:ss').subtract(1,'minutes').format('HH:mm'),
                time_end: moment(m.time_end,'YYYY-MM-DD HH:mm:ss').format('HH:mm'),
                total_price: (m.total_price != null && m.total_price>0)? m.total_price:m.court.price*moment(m.time_end,'YYYY-MM-DD HH:mm').diff(moment(m.time_start,'YYYY-MM-DD HH:mm'),'hours'),
                name: (m.user)? m.user.fullname:(m.description != null)? m.description:'ไม่มีชื่อ',
                book_from: (m.user)? 'จองผ่านแอพ':'จองผ่านสนาม',
                payment: (m.payments.length > 0)? 'จ่ายผ่านแอพ':'จ่ายที่สนาม',
                pay_status: (m.paid_amount > 0 | m.time_end <= now)? 'ชำระแล้ว':'รอชำระ'
            }
        })

        return response.send(result)
    }
}

module.exports = ExportController

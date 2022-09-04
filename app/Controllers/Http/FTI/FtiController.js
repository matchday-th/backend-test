'use strict'

const Provider = use('App/Models/Provider')
const Sport = use('App/Models/Sport')
const Mail = use('Mail')


class FtiController {
    async getAllSP ({ response, auth }) {
        var providers = await Provider
                                .query()
                                .where('available',1)
                                .whereNotIn('id',[1,14])
                                .with('photos')
                                .with('facilities')
                                .with('provider_sports',(bd) => {
                                    bd.with('sport')
                                    bd.with('bus_times')
                                    bd.with('court_types.courts')
                                })
                                .fetch()

        let result = providers.toJSON().map(sp => {
            //Hide some data
            delete sp.password
            delete sp.phone_number
            delete sp.email
            delete sp.minTime
            delete sp.maxTime
            delete sp.public
            delete sp.created_at
            delete sp.updated_at
            delete sp.max_photo
            delete sp.policy
            delete sp.available
            delete sp.custom_text
            delete sp.half_hour

            return sp
        })

        return response.send(result)
    }

    async getEachSP ({ response, auth, params }) {
        var providers = await Provider
                                .query()
                                .where('id',params.id)
                                .where('available',1)
                                .whereNotIn('id',[1,14])
                                .with('photos')
                                .with('facilities')
                                .with('provider_sports',(bd) => {
                                    bd.with('sport')
                                    bd.with('bus_times')
                                    bd.with('court_types.courts')
                                })
                                .fetch()

        let result = providers.toJSON().map(sp => {
            //Hide some data
            delete sp.password
            delete sp.phone_number
            delete sp.email
            delete sp.minTime
            delete sp.maxTime
            delete sp.public
            delete sp.created_at
            delete sp.updated_at
            delete sp.max_photo
            delete sp.policy
            delete sp.available
            delete sp.custom_text
            delete sp.half_hour

            return sp
        })

        return response.send(result[0])
    }

    async allSport ({ response }) {
        let sports = await Sport.all()
        return response.send(sports)
    }

    async send_email_temp({ response, request }) {
        try {
            const {
                send_to,
                subject,
                text
            } = request.body
            let sp_mail = await Mail.raw(`${text}`, (message) => {
                    message.from('booking.matchday@gmail.com','SME WE CARE PLUS')
                    message.to(send_to)
                    message.subject(`${subject}`)
                })
            
            return response.send({ sent: sp_mail.accepted })
        } catch (err) {
            console.log(err);
        }
    }
}

module.exports = FtiController

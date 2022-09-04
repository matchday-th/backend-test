'use strict'

const Database = use('Database')
const moment = use('moment')

const Provider = use('App/Models/Provider')
const ProviderSport = use('App/Models/ProviderSport')
const Service = use('App/Models/Service')
const Facility = use('App/Models/Facility')
const FacilityProvider = use('App/Models/FacilityProvider')
const CourtType = use('App/Models/CourtType')
const Court = use('App/Models/Court')
const Sport = use('App/Models/Sport')
const Role = use('App/Models/Role')
const Promotion = use('App/Models/Promotion')
const Match = use('App/Models/Match')
const Photo = use('App/Models/Photo')
const Rating = use('App/Models/Rating')
const BusTime = use('App/Models/BusTime')
const PeriodPrice = use('App/Models/PeriodPrice')

class MasterController {

    //== System //
    //Tool API
    async callConfirm ({ response, params }) {
        const match = await Match.find(params.id)
        if (match !== null) {
            try {
                if (match.toJSON().call_confirm == 0) {
                    await match.merge({
                        call_confirm : match.call_confirm +1
                    })
                    await match.save()
                    return response.send(`Saved your first call for Match ID: ${params.id}`)
                } else {
                    await match.merge({
                        call_confirm : match.call_confirm +1
                    })
                    await match.save()
                    return response.send(`Saved your ${match.call_confirm} call for Match ID: ${params.id}`)
                }
            } catch (err) {
                console.log(err);
                return response.send({status:'Fail',error:err})
            }
        } else {
            return response.send(`Invalid Call ID`)
        }
    }

    //Sport
    async sport ({ response }) {
        let sports = await Sport.all()
        return response.send(sports)
    }
    async createSport ({ response, request }) {
        const {
            name,
            icon,
            marker
        } = request.body

        let sport = new Sport()
        sport.name = name
        sport.icon = icon
        sport.marker = marker

        try {
            await sport.save()
            return response.send({status : 'Success', created : sport.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }

    }
    async editSport ({ response, request, params }) {
        const body = request.post()
        const sport = await Sport.find(params.id)
        
        try {
            await sport.merge(body)
            await sport.save()
        
            return response.send({status : 'Success', updated : `Sport ID : ${sport.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }

    //Role
    async role ({ response, params }) {
        try {
        if (params.id == 'all') {
            const roles = await Role.all()

            return response.send(roles)
        } else {
            let sport = await Sport.find(params.id)
            await sport.load('roles')

            return response.send(sport)
        }
        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async createRole ({ response, request, params }) {
        const {
            name,
            icon,
        } = request.body

        let role = new Role()
        role.sport_id = params.id
        role.name = name
        role.icon = icon

        try {
            await role.save()
            return response.send({status : 'Success', created : role.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }

    }
    async editRole ({ response, request, params }) {
        const body = request.post()
        const role = await Role.find(params.id)
        
        try {
            await role.merge(body)
            await role.save()
        
            return response.send({status : 'Success', updated : `Role ID : ${role.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deleteRole ({ response, request, params }) {
        const role = await Role.find(params.id)
        const {
            name
        } = request.body
        if (role.name == name) {
            try {
                const fac = await Role
                        .query()
                        .where('id',params.id)
                        .with('preference_roles')
                        .delete()

                return response.send({status : 'Success'})
            } catch (err) {
                return response.send({status : 'Fail', err})
            }
        } else {
            return response.send({status : 'Fail', error : 'Name Unmatched'})
        }
    }

    //Facility
    async facility ({ response }) {
        let fac = await Facility.all()
        return response.send(fac)
    }
    async createFacility ({ response, request }) {
        const {
            name,
            icon,
        } = request.body

        let fac = new Facility()
        fac.name = name
        fac.icon = icon

        try {
            await fac.save()
            return response.send({status : 'Success', created : fac.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }

    }
    async editFacility ({ response, request, params }) {
        const body = request.post()
        const fac = await Facility.find(params.id)
        
        try {
            await fac.merge(body)
            await fac.save()
        
            return response.send({status : 'Success', updated : `Facility ID : ${fac.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deleteFacility ({ response, request, params }) {
        const facility = await Facility.find(params.id)
        const {
            name
        } = request.body
        if (facility.name == name) {
            try {
                const fac = await Facility
                        .query()
                        .where('id',params.id)
                        .with('facility_providers')
                        .delete()

                return response.send({status : 'Success'})
            } catch (err) {
                return response.send({status : 'Fail', err})
            }
        } else {
            return response.send({status : 'Fail', error : 'Name Unmatched'})
        }
    }

    //Promotion
    async promotion ({ response, params }) {
        try {
        if (params.id == 'all') {
            let pro = await Promotion.all()
            return response.send(pro)

        } else if (params.id == 'my') {
            const pros = await Promotion
                            .query()
                            .where('provider_id',null)
                            .fetch()
            return response.send(pros)

        } else {
            const promo = await Promotion.find(params.id)
            return response.send(promo)

        } } catch (err) {
            console.log(err);
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async createPromotion ({ response, request }) {
        const promotionData 
        = request.only(['name',
                        'type',
                        'value',
                        'expire_start',
                        'expire_end',
                        'provider_id',
                        'total_use',
                        'user_limit'])
        try {
        const pro = await Promotion.create(promotionData)
        return response.send({status:'Success',pro})
        } catch (err) {
            return response.send({status:'Fail',err})
        }


    }
    async editPromotion ({ response, request, params }) {
        const body = request.post()
        const pro = await Promotion.find(params.id)
        
        await pro.merge(body)
        await pro.save()
        
        return response.send({status : 'Success', updated : `Promotion ID : ${pro.id}`})
    }
    async deletePromotion ({ response, request, params }) {
        const promotion = await Promotion.find(params.id)
        const {
            name
        } = request.body
        if (promotion.name == name) {
            try {
                const pro = await Promotions
                        .query()
                        .where('id',params.id)
                        .with('promotion_users')
                        .delete()

                return response.send({status : 'Success', pro})
            } catch (err) {
                return response.send({status : 'Fail', error : err.toString()})
            }
        } else {
            return response.send({status : 'Fail', error : 'Name Unmatched'})
        }
    }
    //== == == ==//

    //== Provider Manage//
    async providers ({ response, params }) {
        if (params.id == 'all') {
            const provider = await Provider
                        .query()
                        .with('provider_sports',(bd)=>{
                            bd.with('sport')
                            bd.with('services')
                            bd.with('court_types.courts')
                        })
                        .with('sports')
                        .with('facilities')
                        .with('ratings')
                        .with('photos')
                        .fetch()

            return response.send(provider)
        } else {
            const provider = await Provider
                        .query()
                        .where('id',params.id)
                        .with('provider_sports',(bd)=> {
                            bd.with('sport')
                            bd.with('services')
                            bd.with('court_types.courts')
                        })
                        .with('sports')
                        .with('facilities')
                        .with('ratings')
                        .with('photos')
                        .fetch()

            let result = provider.toJSON()[0]
            return response.send(result)
        }
    }
    async createProvider ({ response, request }) {
        const {
            fullname,
            email,
            password,
            phone_number,
            lat,
            lng,
            logo,
            minTime,
            maxTime
        } = request.body

        let provider = new Provider()
        provider.fullname = fullname
        provider.email = email
        provider.password = password
        provider.phone_number = phone_number
        provider.lat = lat
        provider.lng = lng
        provider.logo = logo
        provider.minTime = minTime
        provider.maxTime = maxTime

        try {
            await provider.save()
            return response.send({ status : 'Success', provider_id : provider.id})
        } catch (err) {
            return response.send({status: 'Fail',error :err})
        }
        
    }
    async updateProvider ({request, response, params}) {

        const body = request.post()
        const pitch = await Provider.find(params.id)
        
        await pitch.merge(body)
        await pitch.save()
        
        return response.send({status : 'Success', updated : `Provider ID : ${pitch.id}`})
    }
    async deleteProvider ({ response, request, params }) {
        const provider = await Provider.find(params.id)
        await provider.loadMany(['provider_sports','facilities','court_types.courts','services'])
        const { fullname } = request.body

        let res = provider.toJSON()
        
        if (res.fullname == fullname) {
            const provider = await Provider
                                .query()
                                .where('id',params.id)
                                .with('provider_sports.court_types.courts.matches')
                                .with('facilities')
                                .with('ratings')
                                .select()

            return response.send({status : 'Success', deleted : provider.id})
        } else {
            return response.send({ status : 'Fail', error : 'conditions unfulfill'})
        }
    }//*

    //== Provider Sport//
    async providerSport ({ response, request, params }) {
        const {
            sport_id,
            calendar_view
        } = request.body

        let ps = new ProviderSport
        ps.sport_id = sport_id,
        ps.provider_id = params.id
        ps.calendar_view = calendar_view

        try {
            await ps.save()

            return response.send({status : 'Success', provider_sport_id : ps.id})
        } catch (err) {

            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async providerEditSport ({ response, request, params }) {
        const body = request.post()
        const providerSport = await ProviderSport.find(params.id)
        
        try {
            await providerSport.merge(body)
            await providerSport.save()
        
            return response.send({status : 'Success', updated : `ProviderSport ID : ${providerSport.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async providerDeleteSport ({ response, request, params }) {
        const providerSport = await ProviderSport.find(params.id)
        const { name } = request.body

        if (providerSport.sport.name == name) {
            await providerSport.delete()

            return response.send({status : 'Success', deleted : providerSport.id})
        } else {
            return response.send({ status : 'Fail', error : 'Name Unmatched'})
        }
    }

    //== Provider Service//
    async createService ({ response, request, params }) {
        const {
            name,
            price
        } = request.body

        let service = new Service()
        service.provider_sport_id = params.id
        service.name = name
        service.price = price

        try {
            await service.save()
            return response.send({status : 'Success', created : service.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }
    async editService ({ response, request, params }) {
        const body = request.post()
        const service = await Service.find(params.id)
        
        try {
            await service.merge(body)
            await service.save()
        
            return response.send({status : 'Success', updated : `Service ID : ${service.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deleteService ({ response, request, params }) {
        const service = await Service.find(params.id)
        const { name } = request.body

        if (service.name == name) {
            await service.delete()

            return response.send({status : 'Success', deleted : service.id})
        } else {
            return response.send({ status : 'Fail', error : 'Name Unmatched'})
        }
    }

    //== Provider Photo//
    async createPhoto ({ response, request, params }) {
        let photo = new Photo()
        photo.provider_id = params.id
        photo.image = request.body.image

        try {
            await photo.save()
            return response.send({status : 'Success', created : photo})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }
    async editPhoto ({ response, request, params }) {
        const body = request.post()
        const photo = await Photo.find(params.id)
        
        try {
            await photo.merge(body)
            await photo.save()
        
            return response.send({status : 'Success', updated : `Photo ID : ${photo.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deletePhoto ({ response, request, params }) {
        const photo = await Photo.find(params.id)

        try {
            await photo.delete()
            return response.send({status : 'Success', deleted : photo.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }

    //== Provider Facility//
    async providerFacility ({ response, request }) {
        const body = request.collect(['provider_id','facility_id'])

        try {
            const fps = await FacilityProvider.createMany(body)
            return response.send({status : 'Success', created : fps})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async providerDeleteFacility ({ response, params }) {
        const facility = await FacilityProvider.find(params.id)

        try {
            await facility.delete()

            return response.send({status : 'Success', deleted : facility.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }

    //== Provider Rating//
    async providerRating ({ response, request }) {
        try {
            const body = request.only(['provider_id','user_id','score','comment'])

            const fps = await Rating.create(body)

            return response.send({status : 'Success', created : fps})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async providerDeleteRating ({ response, params }) {
        const facility = await Rating.find(params.id)

        try {
            await facility.delete()

            return response.send({status : 'Success', deleted : facility.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }

    //== Provider CourtType
    async createType ({ response, request, params }) {
        const {
            name,
            detail,
            type,
            ground_type,
            max_team_size,
            image,
            coupon
        } = request.body

        let court_type = new CourtType()
        court_type.provider_sport_id = params.id
        court_type.name = name
        court_type.detail = detail
        court_type.type = type
        court_type.coupon = coupon
        court_type.image = image
        court_type.ground_type = ground_type
        court_type.max_team_size = max_team_size

        try {
            await court_type.save()
            return response.send({status : 'Success', created : court_type.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }
    async editType ({ response, request, params }) {
        const body = request.post()
        const court_type = await CourtType.find(params.id)
        
        try {
            await court_type.merge(body)
            await court_type.save()
        
            return response.send({status : 'Success', updated : `CourtType ID : ${court_type.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deleteType ({ response, request, params }) {
        const court_type = await CourtType.find(params.id)
        const { name } = request.body

        if (court_type.name == name) {
            await court_type.delete()

            return response.send({status : 'Success', deleted : court_type.id})
        } else {
            return response.send({ status : 'Fail', error : 'Name Unmatched'})
        }
    }

    //== Provider Court
    async createCourt ({ response, request, params }) {
        const {
            name,
            price,
            image
        } = request.body

        let court = new Court()
        court.court_type_id = params.id
        court.name = name
        court.price = price
        court.image = image

        try {
            await court.save()
            return response.send({status : 'Success', created : court.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }
    async editCourt ({ response, request, params }) {
        const body = request.post()
        const court = await Court.find(params.id)
        
        try {
            await court.merge(body)
            await court.save()
        
            return response.send({status : 'Success', updated : `Court ID : ${court.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deleteCourt ({ response, request, params }) {
        const court = await Court.find(params.id)
        const { name } = request.body

        if (court.name == name) {
            await court.delete()

            return response.send({status : 'Success', deleted : court.id})
        } else {
            return response.send({ status : 'Fail', error : 'Name Unmatched'})
        }
    }

    //== Provider Bustime
    async createBusTime ({ response, request, params }) {
        const sport_id = params.id
        const {
            days,
            open_time,
            close_time
        } = request.body

        var bus_times = new BusTime()
        bus_times.provider_sport_id = sport_id
        bus_times.days = days
        bus_times.open_time = open_time
        bus_times.close_time = close_time

        try {
            await bus_times.save()
            return response.send({status : 'Success', created : bus_times.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }
    async editBusTime ({ response, request, params }) {
        const body = request.post()
        const bus_times = await BusTime.find(params.id)
        
        try {
            await bus_times.merge(body)
            await bus_times.save()
        
            return response.send({status : 'Success', updated : `BusTime ID : ${bus_times.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deleteBusTime ({ response, params }) {
        const bus_times = await BusTime.find(params.id)

        try {
            await bus_times.delete()

            return response.send({status : 'Success', deleted : bus_times.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
        
    }

    //== Provider Period Price
    async createPeriodPrice ({ response, request, params }) {
        const sport_id = params.id
        const {
            days,
            start_time,
            end_time,
            var_type,
            var_price
        } = request.body

        var period_price = new PeriodPrice()
        period_price.provider_sport_id = sport_id
        period_price.days = days
        period_price.start_time = start_time
        period_price.end_time = end_time
        period_price.var_type = var_type
        period_price.var_price = var_price

        try {
            await period_price.save()
            return response.send({status : 'Success', created : period_price.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
    }
    async editPeriodPrice ({ response, request, params }) {
        const body = request.post()
        const period_price = await PeriodPrice.find(params.id)
        
        try {
            await period_price.merge(body)
            await period_price.save()
        
            return response.send({status : 'Success', updated : `BusTime ID : ${period_price.id}`})

        } catch (err) {
            return response.send({status : 'Fail', error : err.toString()})
        }
    }
    async deletePeriodPrice ({ response, params }) {
        const period_price = await PeriodPrice.find(params.id)

        try {
            await period_price.delete()

            return response.send({status : 'Success', deleted : period_price.id})
        } catch (err) {
            return response.send({ status : 'Fail', error : err.toString()})
        }
        
    }

    async reset_court_type_price ({ response, request }) {
        const court_types = await CourtType
            .query()
            .where('share_court', 0)
            .where('price', 0)
            .whereHas('courts', (court) => {
                court.whereNot('price', 0)
            })
            .with('courts')
            .fetch()

            console.log(court_types);

        var array = court_types.toJSON()
        array = await array.map(({ id, price, courts }) => {
            return { id, price, courts }
        })

        array.forEach(async ({ id, price, courts }) => {
            console.log({ id, price, courts: courts[0]});
            // const court_price = courts[0].price
            // const court_type = await CourtType.find(id.id)
            // await court_type.merge({ price: court_price })
            // await court_type.save()
        })

            
        return response.send(array)
    }
}

module.exports = MasterController

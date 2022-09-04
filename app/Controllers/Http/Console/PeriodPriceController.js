'use strict'

const PeriodPrice = use('App/Models/CourtTypePeriodPrice')
const ProviderSport = use('App/Models/ProviderSport')
const Provider = use('App/Models/Provider')
const Database = use('Database')


class PeriodPriceController {

  async getAllPeriodType ({ response, request, params }) {
    var types = await Provider
                    .query()
                    .where('id',params.id)
                    .select('id','fullname')
                    .with('provider_sports',(qb)=> {
                      qb.with('sport')
                      qb.with('court_types')
                    })
                    .fetch()
    
    var ad = types.toJSON()[0].provider_sports.map(sport => {
      return {id: sport.id,sport: sport.sport.name, court_types: sport.court_types.map(ct => {
        return { id: ct.id, name: ct.name}
      })}
    })

    return response.send(ad)
  }

  async store ({ request, response }) {
    const { court_type_id, period_price_id } = request.body

    try {
      var price = new PeriodPrice()
      price.court_type_id = court_type_id
      price.period_price_id = period_price_id

      await price.save()

      return response.send({ status: 'success', price: price})
    } catch (err) {
      return response.status(500).send({ status: 'fail', error: err.toString()})
    }

  }
}

module.exports = PeriodPriceController

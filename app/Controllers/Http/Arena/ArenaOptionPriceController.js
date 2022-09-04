'use strict'

const OptionPrice = use('App/Models/OptionPrice')

class ArenaOptionPriceController {
    async index({response, auth}) {
        try {
            const provider = await auth.getUser()
            var prices = await OptionPrice
                .query()
                .where('provider_id',provider.id)
                .fetch()
                
            return response.send(prices)
        } catch (err) {
            console.log(err);
            return response.send(err.toString())
        }
        
    }
    async store({response, request, auth }) {
        try {
            const provider = await auth.getUser()
            request.body.provider_id = provider.id
            const option_price = await OptionPrice.create(request.body)
            return response.send({ status: 'success', created: option_price})
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString()})
        }
    }

    async update({response, request, params}) {
        try {
            const option_price = await OptionPrice.find(params.id)
            await option_price.merge(request.body)
            await option_price.save()

            return response.send({ status: 'success', updated: option_price})
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString()})
        }
    }

    async destroy({response, params}) {
        try {
            const option_price = await OptionPrice.find(params.id)
            await option_price.delete()

            return response.send({ status: 'success', deleted: option_price})
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString()})
        }
    }
}

module.exports = ArenaOptionPriceController

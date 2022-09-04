'use strict'

const { Checker } = require('../Utility')

class PortalPriceController {
    async court_price ({ response, request, params }) {
        const { time_start, time_end } = request.body
        const price = await Checker.checkCourtPrice(params.court_id, time_start, time_end)

        return response.send(price)
    }
}

module.exports = PortalPriceController

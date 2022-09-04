'use strict'

const Package = use('App/Models/Package')

class SaleController {
    async sales_packages({ response }) {
        return await Package.all()
    }
}

module.exports = SaleController

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PosSubscription extends Model {
    static get hidden () {
        return ['provider_id','package_id']
    }

    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    static get dates() {                                                                                                                           
        return super.dates.concat(['end_date'])                                                                                                           
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    package() {
        return this.belongsTo('App/Models/Package')
    }

    payments() {
        return this.hasMany('App/Models/Payment')
    }

    invoices() {
        return this.hasMany('App/Models/Invoice')
    }
}

module.exports = PosSubscription

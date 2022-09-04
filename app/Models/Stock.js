'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Stock extends Model {
    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    matches() {
        return this
            .belongsToMany('App/Models/Match')
            .pivotTable('match_stock')   
    }
}

module.exports = Stock

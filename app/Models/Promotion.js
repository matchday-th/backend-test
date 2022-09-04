'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Promotion extends Model {
    static get dates() {                                                                                                                           
        return super.dates.concat(['expire_start','expire_end'])                                                                                                           
    }

    matches() {
        return this.hasMany('App/Models/Match')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    promotion_users() {
        return this.hasMany('App/Models/PromotionUser')
    }

    users() {
        return this
            .belongsToMany('App/Models/User')
            .pivotTable('promotion_users')
            
    }

    condition() {
        return this
            .belongsToMany('App/Models/Condition')
            .pivotTable('condition_promotions')
    }
}

module.exports = Promotion

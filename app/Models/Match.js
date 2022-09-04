'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Match extends Model {

    static get dates() {                                                                                                                           
        return super.dates.concat(['time_start','time_end'])                                                                                                           
    }

    rooms() {
        return this.hasMany('App/Models/Room')
    }

    ratings() {
        return this.hasMany('App/Models/Rating')
    }

    user() {
        return this.belongsTo('App/Models/User')
    }

    court() {
        return this.belongsTo('App/Models/Court')
    }

    provider() {
        return this.belongsTo('App/Models/Provider')
    }

    preference(){
        return this.belongsTo('App/Models/Preference')
    }

    promotion() {
        return this.belongsTo('App/Models/Promotion')
    }

    services() {
        return this
            .belongsToMany('App/Models/Service')
            .pivotModel('App/Models/MatchService')  
            .withPivot(['id','amount','service_id','price', 'pay_method'])
    }
    inventories() {
        return this
            .belongsToMany('App/Models/Inventory')
            .pivotModel('App/Models/UsedInventory')  
            .withPivot(['id','amount','inventory_id','price'])
    }
    
    stack() {
        return this.belongsTo('App/Models/Stack')
    }

    payments() {
        return this
            .belongsToMany('App/Models/Payment')
            .pivotTable('match_payments')   
    }

    contacts() {
        return this.hasMany('App/Models/ContactMatch')
    }

    used_bundle() {
        return this.hasOne('App/Models/UsedBundle')
    }

    match_discount() {
        return this.hasOne('App/Models/MatchDiscount')
    }
}

module.exports = Match

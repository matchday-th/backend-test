'use strict'

const Model = use('Model')
const Hash = use('Hash')

class Provider extends Model {

    static boot () {
        super.boot()
        this.addHook('beforeSave', async (userInstance) => {
          if (userInstance.dirty.password) {
            userInstance.password = await Hash.make(userInstance.password)
          }
        })

        this.addHook('afterPaginate', async (a, b) => {
          
        })
    }

    static get hidden () {
      return ['password','created_at','updated_at']
    }

    pos_subscription() {
      return this.hasOne('App/Models/PosSubscription')
    }

    matches() {
      return this.hasMany('App/Models/Match')
    }

    providertokens() {
        return this.hasMany('App/Models/ProviderToken')
    }

    stacks() {
      return this.hasMany('App/Models/Stack')
    }

    photos() {
      return this.hasMany('App/Models/Photo')
    }

    services() {
      return this.manyThrough('App/Models/ProviderSport', 'services')
    }

    inventories() {
      return this.hasMany('App/Models/Inventory')
    }

    stocks() {
      return this.hasMany('App/Models/Stock')
    }

    ratings() {
      return this.hasMany('App/Models/Rating')
    }

    promotions() {
      return this.hasMany('App/Models/Promotion')
    }

    sports(){
      return this
          .belongsToMany('App/Models/Sport')
          .pivotTable('provider_sports')
    }

    court_types() {
      return this.manyThrough('App/Models/ProviderSport','court_types')
    }

    provider_sports() {
      return this.hasMany('App/Models/ProviderSport')
    }

    facilities(){
      return this
          .belongsToMany('App/Models/Facility')
          .pivotTable('facility_providers')
    }

    bus_times() {
      return this.manyThrough('App/Models/ProviderSport','bus_times')
    }

    users() {
      return this
          .belongsToMany('App/Models/User')
          .pivotTable('members')
    }
    
    staffs() {
      return this.hasMany('App/Models/Staff')
    }

    packages() {
       return this.hasMany('App/Models/PackageProvider')
    }
    blogs() {
      return this.hasMany('App/Models/Blog')
    }

    address() {
      return this.hasOne('App/Models/Address')
    }

    option_prices() {
      return this.hasMany('App/Models/OptionPrice')
    }
    
}

module.exports = Provider

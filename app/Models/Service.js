'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Service extends Model {
  static boot() {
    super.boot()
    this.addTrait('NoTimestamp')
  }

  matches() {
    return this
        .belongsToMany('App/Models/Match')
        .pivotTable('match_services')   
  }

  match_services() {
    return this.hasMany('App/Models/MatchService')
  }

  provider_sport() {
    return this.belongsTo('App/Models/ProviderSport')
  }
}

module.exports = Service

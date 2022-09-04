'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Court extends Model {

  static boot() {
    super.boot()
    this.addTrait('NoTimestamp')
  }

  court_type() {
    return this.belongsTo('App/Models/CourtType')
  }

  matches() {
    return this.hasMany('App/Models/Match')
  }
  
  sub_court_type() {
    return this.belongsTo('App/Models/CourtType','sub_court_type_id','id')
  }
}

module.exports = Court

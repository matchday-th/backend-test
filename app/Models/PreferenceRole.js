'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PreferenceRole extends Model {
  static boot() {
    super.boot()
    this.addTrait('NoTimestamp')
  }

  preference() {
    return this.belongsTo('App/Models/Preference')
  }

  role() {
    return this.belongsTo('App/Models/Role')
  }
}

module.exports = PreferenceRole

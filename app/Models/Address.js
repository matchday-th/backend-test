'use strict'

const Model = use('Model')

class Address extends Model {
  static boot () {
    super.boot()
    this.addTrait('NoTimestamp')
  }
  provider() {
    return this.belongsTo('App/Models/Provider')
  }

  province() {
    return this.belongsTo('App/Models/Province')
  }

  district() {
    return this.belongsTo('App/Models/District')
  }
}

module.exports = Address

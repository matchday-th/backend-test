'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

class User extends Model {
  static boot () {
    super.boot()

    /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeSave', async (userInstance) => {
      if (userInstance.dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    })
  }
  
  static get hidden () {
    return ['password']
  }

  tokens () {
    return this.hasMany('App/Models/Token')
  }

  matches() {
    return this.hasMany('App/Models/Match')
  }

  stacks() {
    return this.hasMany('App/Models/Stack')
  }

  friends(){
    return this.hasMany('App/Models/Friend')
  }

  rooms() {
    return this.hasMany('App/Models/Room')
  }

  ratings() {
    return this.hasMany('App/Models/Rating')
  }

  preferences() {
    return this.hasMany('App/Models/Preference')
  }

  providers() {
    return this
        .belongsToMany('App/Models/Provider')
        .pivotTable('members')
  }

  user_credentials() {
    return this.hasMany('App/Models/UserCredential')
  }

  asset() {
    return this.hasOne('App/Models/Asset')
  }

  payments() {
    return this.hasMany('App/Models/Payment')
  }
  
}

module.exports = User

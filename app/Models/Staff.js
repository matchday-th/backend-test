'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')


class Staff extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
        this.addHook('beforeSave', async (userInstance) => {
            if (userInstance.dirty.password) {
              userInstance.password = await Hash.make(userInstance.password)
            }
          })
    }

    stafftokens() {
        return this.hasMany('App/Models/StaffToken')
    }
    
    provider() {
        return this.belongsTo('App/Models/Provider')
    }
}

module.exports = Staff

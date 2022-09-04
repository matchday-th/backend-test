'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PackageProvider extends Model {

        static boot() {
                super.boot()
                this.addTrait('NoTimestamp')
                
            }

    provider() {

            return this.belongsTo('App/Models/Provider')
        
    }
    package() {
        
            return this.belongsTo('App/Models/Package')
        
    }


}

module.exports = PackageProvider

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Package extends Model {

    static get hidden () {
        return ['id']
    }

    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
        
    }

    providers() { 
        return this.manyThrough('App/Models/PackageProvider','provider')
    }

    pos_settings() {
        return this.hasMany('App/Models/PosSetting')
    }

}

module.exports = Package

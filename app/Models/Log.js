'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Log extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }
    
    match() {
        return this.belongsTo('App/Models/Match')
    }
}

module.exports = Log

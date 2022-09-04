'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Setting extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    rude_words() {
        return this.hasMany('App/Models/RudeWord')
    }
}

module.exports = Setting

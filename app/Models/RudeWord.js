'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RudeWord extends Model {
    static boot() {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    setting() {
        return this.belongsTo('App/Models/Setting')
    }
}

module.exports = RudeWord

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CourtMatch extends Model {
    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
    }

    court() {
        return this.belongsTo('App/Models/Court')
    }

    match() {
        return this.belongsTo('App/Models/Match')
    }
}

module.exports = CourtMatch

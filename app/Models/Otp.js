'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Otp extends Model {
    static boot () {
        super.boot()
        this.addTrait('Created_at_only')
    }
}

module.exports = Otp

'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

class MatchRoom extends Model {
    static get connection () {
        return Env.get('DB2_CONNECTION')
    }
}

module.exports = MatchRoom

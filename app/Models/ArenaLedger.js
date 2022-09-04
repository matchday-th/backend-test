'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ArenaLedger extends Model {
    arena_ledger_transaction() {
        return this.hasOne('App/Models/ArenaLedgerTransaction')
    }
}

module.exports = ArenaLedger

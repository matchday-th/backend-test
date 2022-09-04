'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ArenaLedgerTransaction extends Model {
    arena_ledger() {
        return this.belongsTo('App/Models/ArenaLedger')
    }
}

module.exports = ArenaLedgerTransaction

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MatchServiceSchema extends Schema {
  up () {
    this.create('match_services', (table) => {
      table.increments()
      table.integer('match_id')
      table.integer('service_id')
      table.integer('amount')
    })
  }

  down () {
    this.drop('match_services')
  }
}

module.exports = MatchServiceSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LogSchema extends Schema {
  up () {
    this.create('logs', (table) => {
      table.increments()
      table.integer('match_id').notNullable()
      table.string('version')
      table.string('method')
    })
  }

  down () {
    this.drop('logs')
  }
}

module.exports = LogSchema

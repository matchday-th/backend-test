'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class LogTcprivacySchema extends Schema {
  up () {
    this.create('log_tcprivacies', (table) => {
      table.increments()
      table.integer('provider_id')
      table.integer('version')
      table.timestamps()
    })
  }

  down () {
    this.drop('log_tcprivacies')
  }
}

module.exports = LogTcprivacySchema

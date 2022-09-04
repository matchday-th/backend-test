'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TcprivacyVersionSchema extends Schema {
  up () {
    this.create('tcprivacy_versions', (table) => {
      table.increments()
      table.integer('version')
      table.timestamps()
    })
  }

  down () {
    this.drop('tcprivacy_versions')
  }
}

module.exports = TcprivacyVersionSchema

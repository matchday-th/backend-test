'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PackageSchema extends Schema {
  up () {
    this.create('packages', (table) => {
      table.increments()
      table.integer('price')
      table.integer('level')
      table.string('name')
     
    })
  }

  down () {
    this.drop('packages')
  }
}

module.exports = PackageSchema

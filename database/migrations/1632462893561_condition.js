'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ConditionSchema extends Schema {
  up () {
    this.create('conditions', (table) => {
      table.increments()
    })
  }

  down () {
    this.drop('conditions')
  }
}

module.exports = ConditionSchema

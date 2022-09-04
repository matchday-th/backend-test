'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StaffSchema extends Schema {
  up () {
    this.create('staff', (table) => {
      table.increments()
      table.integer('provider_id').notNullable()
      table.string('username', 80).notNullable().unique()
      table.string('fullname', 80)
      table.string('password', 60).notNullable()
      table.integer('level').defaultTo(4)
    })
  }

  down () {
    this.drop('staff')
  }
}

module.exports = StaffSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RoleSchema extends Schema {
  up () {
    this.create('roles', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('sport_id').notNullable()
      table.string('name').notNullable()
      table.string('icon')
    })
  }

  down () {
    this.drop('roles')
  }
}

module.exports = RoleSchema

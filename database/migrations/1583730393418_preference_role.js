'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PreferenceRoleSchema extends Schema {
  up () {
    this.create('preference_roles', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('preference_id').notNullable()
      table.integer('role_id').notNullable()
    })
  }

  down () {
    this.drop('preference_roles')
  }
}

module.exports = PreferenceRoleSchema

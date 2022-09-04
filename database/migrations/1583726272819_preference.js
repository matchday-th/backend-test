'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PreferenceSchema extends Schema {
  up () {
    this.create('preferences', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('user_id').notNullable()
      table.string('name').notNullable()
      table.string('sex')
      table.integer('age_a')
      table.integer('age_b')
      table.integer('team_size')
      table.string('message')
      table.timestamps()
    })
  }

  down () {
    this.drop('preferences')
  }
}

module.exports = PreferenceSchema

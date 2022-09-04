'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AccessLevelSettingSchema extends Schema {
  up () {
    this.create('access_level_settings', (table) => {
      table.increments()
      table.string('levels')
      table.timestamps()
    })
  }

  down () {
    this.drop('access_level_settings')
  }
}

module.exports = AccessLevelSettingSchema

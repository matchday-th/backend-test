'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SettingSchema extends Schema {
  up () {
    this.create('settings', (table) => {
      table.increments()
      table.integer('preference_text_limit')
    })
  }

  down () {
    this.drop('settings')
  }
}

module.exports = SettingSchema

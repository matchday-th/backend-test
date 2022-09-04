'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PosSettingSchema extends Schema {
  up () {
    this.create('pos_settings', (table) => {
      table.increments()
      table.integer('package_id')
      table.string('topic')
      table.integer('access_level')
      table.integer('limit')
    })
  }

  down () {
    this.drop('pos_settings')
  }
}

module.exports = PosSettingSchema

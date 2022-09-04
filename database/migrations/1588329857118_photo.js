'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PhotoSchema extends Schema {
  up () {
    this.create('photos', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_id').notNullable()
      table.string('image').notNullable()
    })
  }

  down () {
    this.drop('photos')
  }
}

module.exports = PhotoSchema

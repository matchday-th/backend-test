'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TrainerUuidSchema extends Schema {
  up () {
    this.create('trainer_uuids', (table) => {
      table.increments()
      table.string('uuid').notNull()
      table.integer('user_id').notNull()
      table.boolean('is_provider').defaultTo(false)
      table.boolean('is_login').defaultTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('trainer_uuids')
  }
}

module.exports = TrainerUuidSchema

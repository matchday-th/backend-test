'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StaffTokenSchema extends Schema {
  up () {
    this.create('staff_tokens', (table) => {
      table.increments()
      table.integer('staff_id').unsigned().references('id').inTable('staff')
      table.string('token', 255).notNullable().unique().index()
      table.string('type', 80).notNullable()
      table.boolean('is_revoked').defaultTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('staff_tokens')
  }
}

module.exports = StaffTokenSchema

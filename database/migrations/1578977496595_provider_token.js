'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProviderTokenSchema extends Schema {
  up () {
    this.create('provider_tokens', (table) => {
      table.increments()
      table.integer('provider_id').unsigned().references('id').inTable('providers')
      table.string('token', 255).notNullable().unique().index()
      table.string('type', 80).notNullable()
      table.boolean('is_revoked').defaultTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('provider_tokens')
  }
}

module.exports = ProviderTokenSchema

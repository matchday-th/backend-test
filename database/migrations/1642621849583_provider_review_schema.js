'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProviderReviewSchema extends Schema {
  up () {
    this.create('provider_reviews', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.string('name', 255)
      table.string('avatar', 255)
      table.string('review', 255)
      table.timestamps()
    })
  }

  down () {
    this.drop('provider_reviews')
  }
}

module.exports = ProviderReviewSchema

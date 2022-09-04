'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RatingSchema extends Schema {
  up () {
    this.create('ratings', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.integer('provider_id').notNullable()
      table.integer('match_id')
      table.integer('user_id').notNullable()
      table.string('comment')
      table.integer('score').notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('ratings')
  }
}

module.exports = RatingSchema

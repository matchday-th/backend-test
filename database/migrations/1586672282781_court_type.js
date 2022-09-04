'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CourtTypeSchema extends Schema {
  up () {
    this.create('court_types', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.boolean('coupon').defaultTo(false)
      table.integer('provider_sport_id').notNullable()
      table.string('name').notNullable()
      table.string('type').notNullable()
      table.integer('price')
      table.string('ground_type').notNullable()
      table.string('detail')
      table.integer('max_team_size').notNullable()
      table.string('image').notNullable()
      table.integer('depo_val').defaultTo('0')
    })
  }

  down () {
    this.drop('court_types')
  }
}

module.exports = CourtTypeSchema

'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProviderSchema extends Schema {
  up () {
    this.create('providers', (table) => {
      table.increments()
      table.boolean('deleted').defaultTo(false)
      table.string('fullname', 80).notNullable()
      table.string('phone_number').notNullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.integer('max_photo').defaultTo(6)
      table.boolean('policy').defaultTo(false)
      table.string('logo')
      table.string('logo2')
      table.integer('view').defaultTo(0)
      table.string('location')
      table.string('custom_text')
      table.string('lang').defaultTo('th')
      table.decimal('lat',[10],[8])
      table.decimal('lng',[11],[8])
      table.string('minTime')
      table.string('maxTime')
      table.boolean('available').defaultTo(true)
      table.boolean('public').defaultTo(false)
      table.integer('online_pay').defaultTo('2')
      table.integer('deposit_pay').defaultTo(0)
      table.integer('stars').defaultTo(3)
      table.string('url_nickname').unique()
      table.timestamps()
    })
  }

  down () {
    this.drop('providers')
  }
}

module.exports = ProviderSchema

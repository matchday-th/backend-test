'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up () {
    this.create('users', (table) => {
      table.increments()
      table.string('username', 80).unique()
      table.boolean('pre_regis').defaultTo(false)
      table.string('fullname', 80).notNullable().unique()
      table.string('firstname', 80).notNullable()
      table.string('lastname', 80).notNullable()
      table.string('phone_number').notNullable().unique()
      table.string('email', 254).notNullable().unique()
      table.string('password', 60).notNullable()
      table.integer('reward_point')
      table.string('nickname')
      table.string('dob')
      table.string('avatar')
      table.integer('age')
      table.string('sex')
      table.string('location')
      table.decimal('lat',[10],[8])
      table.decimal('lng',[11],[8])
      table.boolean('concent').defaultTo(false)
      table.string('lang').defaultTo('th')
      table.timestamps()
    })
  }

  down () {
    this.drop('users')
  }
}

module.exports = UserSchema

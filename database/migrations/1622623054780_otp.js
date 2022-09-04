'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OtpSchema extends Schema {
  up () {
    this.create('otps', (table) => {
      table.increments()
      table.integer('otp_code').notNull()
      table.boolean('verify').defaultTo(false)
      table.string('phone_number').notNull()
      table.string('ref').notNull()
      table.datetime('expire').notNull()
      table.datetime('created_at').notNull()
    })
  }

  down () {
    this.drop('otps')
  }
}

module.exports = OtpSchema

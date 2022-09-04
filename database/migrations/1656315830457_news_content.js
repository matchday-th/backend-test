'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NewsContentSchema extends Schema {
  up () {
    this.create('news_contents', (table) => {
      table.increments()
      table.integer('news_id')
      table.string('align')
      table.text('text')
      table.string('photo')
    })
  }

  down () {
    this.drop('news_contents')
  }
}

module.exports = NewsContentSchema

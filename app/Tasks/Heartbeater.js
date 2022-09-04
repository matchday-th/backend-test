'use strict'

const Task = use('Task')
const Database = use('Database')
const moment = use('moment')

class Heartbeater extends Task {
  static get schedule () {
    return '*/1 * * * *'
  }

  async handle () {
    let select = await Database
                  .table('users')
                  .last()
  }
}

module.exports = Heartbeater

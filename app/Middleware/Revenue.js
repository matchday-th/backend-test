'use strict'


const { timeFormat } = require("../Controllers/Http/Helper")

const moment = use('moment')

class Revenue {
  async handle ({ request, response }, next) {
    try {
      const { time_start, time_end } = request.body

      request.body.time_start = moment(time_start,timeFormat).subtract(6,'hours').format(timeFormat)
      request.body.time_end = moment(time_end,timeFormat).subtract(3,'hours').format(timeFormat)

      await next()
    } catch (err) {
      console.log(err);
      await next()
    }
  }
}

module.exports = Revenue

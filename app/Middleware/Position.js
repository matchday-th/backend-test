'use strict'

const Setting = use('App/Models/Setting')

class Position {
  async handle ({ request, response }, next) {
    // call next to advance the request
    
    const setting = await Setting.first()
    const whitelist = setting.whitelist.split(',')
    const client_ip = request.header('x-appengine-user-ip')

    if (whitelist.includes(client_ip)) {
      await next()
    } else {
      return response.send(`== UNAUTHORIZED IP: ${client_ip} ==`)
    }
  }
}

module.exports = Position

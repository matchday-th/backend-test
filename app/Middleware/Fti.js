'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Fti {
  async handle ({ request, response }, next) {
    // call next to advance the request
    
    const secret = '0C7CA77D1E737C914B5DA01190C807CC'
    //FTI keyword
    //Text : FTI special token
    //Hashed with MD5

    const message = 
    `== Other use outside "FTI x MatchdayTH" Project is forbidden. ==`

    if (request.headers().authorization == `Bearer ${secret}`) {
      await next()
    } else {
      return response.send(message)
    }
  }
}

module.exports = Fti

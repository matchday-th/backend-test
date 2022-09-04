'use strict'

const Utility = require("../Controllers/Http/Utility")

const Token = use('App/Models/Token')

class DemoAdmin {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle ({ request, response, auth }, next) {
    try {
      const provider = await auth.authenticator('Arena').getUser()

      if (provider.id == 1) {
        const token = request.headers().authorization.split(' ')[1]
        if (await Utility.FindOrCreate.allow_prefix_pass(token)) {
          await next()
        } else {
          return response.status(401).send()
        }
      } else {
        await next()
      }
    } catch (err) {
      // console.log(err);
      await next()

    }
  }
}

module.exports = DemoAdmin

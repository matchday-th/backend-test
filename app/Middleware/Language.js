'use strict'

class Language {
  async handle ({ request, auth}, next) {
    const { lang } = await auth.getUser();
    request.get().lang = lang
    await next()
  }
}

module.exports = Language

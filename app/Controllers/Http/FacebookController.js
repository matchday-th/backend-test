'use strict'

class FacebookController {
    async delete_user ({ request, response, auth }) {
        return response.send('ok')
    }
}

module.exports = FacebookController

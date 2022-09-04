'use strict'

const { Creator } = require('../Utility')

class CoreMatchController {
    async create_match({ request, response, auth }) {
        try {
            const user = await auth.getUser()
            var match = request.body
            match.user = user.toJSON()
            
            var result = await Creator.makeMatch(match,(match.getMail != undefined)? match.getMail:true, 'core-app')
            result.status = (result.matches.length>0)? true:false

            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.send(err.toString())
        }
    }
}

module.exports = CoreMatchController

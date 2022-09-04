'use strict'

const Member = use('App/Models/Member')

class MemberController {
    async unMember ({ response, auth, params }) {
        try {
            const sp = await auth.getUser()
            const member = await Member
                            .query()
                            .where('user_id',params.id)
                            .where('provider_id',sp.id)
                            .delete()

            return response.send({ status: 'Success', member: member.id})
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString() })
        }
        
    }
}

module.exports = MemberController

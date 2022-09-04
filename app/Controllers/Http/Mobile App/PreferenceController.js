'use strict'

const Pref = use('App/Models/Preference')
const Role = use('App/Models/Role')
const PrefRole = use('App/Models/PreferenceRole')

class PreferenceController {

    async index({auth, response}){

        const user = await auth.getUser()
        await user.load('preferences.roles')

        return response.send(user.toJSON().preferences)
    }

    async update ({ request, response, params, auth}) {
        let pref = await Pref.find(params.id)
        const user = await auth.getUser()

        if (pref.user_id == user.id) {
            pref.merge(request.body)
            await pref.save()

            return response.send({status:'Success',updated:pref})
        } else {

            return response.send({status:'Fail',reason:'not your pref'})
        }
    }

    async store({auth, response, request}) {
        const {
            name,
            sex,
            age_a,
            age_b,
            team_size,
            message
        } = request.body

        const user = await auth.getUser()

        let pref = new Pref()
        pref.user_id = user.id
        pref.name = name
        pref.sex = sex
        pref.age_a = age_a
        pref.age_b = age_b
        pref.team_size = team_size
        pref.message = message

        await pref.save()
        return response.send({status:'Success',
                                msg:`Created :${name}`,
                                pref_id: pref.id})
    }

    async destroy ({auth, response, request, params}) {
        const pref = await Pref.find(params.id)
        const uid = await auth.getUser()
        if (pref.user_id == uid.id) {
            pref.delete()
            return response.send('== Pref Deleted ==')
        } else {
            return response.send('== Not Authorized ==')
        }
    }

    async allRoles ({response}) {
        const roles = await Role.all()

        return response.send(roles)
    }

    async pickRoles ({request,response, params}) {
        const pref = await Pref.find(params.id)

        let picked = new PrefRole()
        picked.preference_id = pref.id
        picked.role_id = request.body.role_id

        await picked.save()
        return response.send({status:'Success',picked})
    }

}

module.exports = PreferenceController

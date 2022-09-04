'use strict'

const Setting = use('App/Models/Setting')
const RudeWord = use('App/Models/RudeWord')

class SettingController {
    async prefLimit ({ response }) {
        const setting = await Setting.find(1)
        await setting.load('rude_words')

        return response.send(setting)
    }

    async addRudeWord ({ response, request }) {
        const setting = await Setting.find(1)
        const { word } = request.body

        try {
        let rude = new RudeWord()
        rude.setting_id = setting.id
        rude.word = word

        await rude.save()
        return response.send({status: 'success', rude_id : rude.id})
        } catch (err) {
            return response.send({status: 'fail', error :err})
        }
    }
}

module.exports = SettingController

'use strict'

const { Code_Generator, SMS } = require("./Utility")
const AssetBundle = use('App/Models/AssetBundle')

class RecruitTestController {
    async test_api({ response, params, request, auth }) {
        const { api_key } = request.get()
        const api_keys = {
            champmar1e5t: {
                profile: 'champmar',
                action: 'paid',
                amount: 500,
                product: 'Match',
                services: [
                    { name: 'ไม้แบต', price: 50, amount: 2 }, 
                    { name: 'ไม้กอล์ฟ', price: 150, amount: 3 }, 
                    { name: 'ไม้มาลัย', price: 250, amount: 4 }
                ]
            },
            jun1te42: {
                profile: 'jun',
                action: 'deposit',
                amount: 1500,
                product: 'Stack',
                inventory: [
                    { name: 'โค้ก', price: 25, amount: 20 }, 
                    { name: 'แฟนต้า', price: 15, amount: 35 }, 
                    { name: 'เค้ก', price: 69, amount: 4 }
                ],
                level: {
                    value: 4,
                    type: 'Admin'
                }
            }
        }
        if (api_keys[api_key]) {
            return response.send(api_keys[api_key])
        } else {
            return response.status(500).send({ message: 'invalid api_key' })
        }
    }
}

module.exports = RecruitTestController

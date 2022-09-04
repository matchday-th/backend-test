'use strict'

const Extension = require("../Extension")
const Promotion = use('App/Models/Promotion')

class PromotionController {
    async check_promotion_with_email({ request, response, auth }) {
        try {
            const { email, phone_number, code } = request.body
            var promo = await Promotion
                .query()
                .where('name',code)
                .whereHas('condition')
                .with('condition')
                .fetch()

            if (promo) {
                promo = promo.toJSON()[0]

                var { name, type, value, expire_start, expire_end, condition } = promo
                if (condition.length > 0) {
                    condition = condition[0]
                    condition.start = expire_start
                    condition.end = expire_end
                }
            
                const result = {
                    name: name,
                    in_condition: await Extension.Promotion.in_condition({ email, phone_number }, condition),
                    params: {
                        percent: type == 'percent',
                        value: value,
                        max: condition.max_reduction
                    }
                }

                return response.send(result)
            } else {
                return response.send({ error: 'invalid promotion'})
            }
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString()})
        }
    }
}

module.exports = PromotionController

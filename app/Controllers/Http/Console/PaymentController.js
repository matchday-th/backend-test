'use strict'

const { Email, FindOrCreate, RefNo, Tools, UpdateOnPayment ,Notification} = require("../Utility")

const Payment = use('App/Models/Payment')
const Match = use('App/Models/Match')
const MatchPayment = use('App/Models/MatchPayment')
const AssetBundlePromotion = use('App/Models/AssetBundlePromotion')
const Stack = use('App/Models/Stack')
const Asset = use('App/Models/Asset')
const Bundle = use('App/Models/Bundle')
const AssetBundle = use('App/Models/AssetBundle')
const moment = use('moment')

class PaymentController {

    async payment ({ request, response}) {
        try {
            const {
                refno,
                cardtype,
                productdetail,
                total,
                merchantid
            } = request.body

            const product = productdetail.split('-')
            const sum_service = product[product.length-2] == 'SUMSERVICE'? product[product.length-1]:0

            var paid = new Payment()
            paid.refno = refno
            paid.cardtype = cardtype
            paid.productdetail = productdetail
            paid.total = total
            paid.merchantid = merchantid
            paid.match_id = (product[1] == 'Match')? product[2]:null
            paid.on_date = moment().format('YYYY-MM-DD')

            await paid.save()

            if (product[1] == 'Bundle') {
                const bundle_id = product[2]
                const amount = parseFloat(product[4])
                const user_id = product[6]

                var user_asset = await FindOrCreate.user_asset(user_id)
                const bundle_info = await Bundle.find(bundle_id)
                var bundles = []
                for (var i=0;i<amount;i++) {
                    const asset_bundle = await AssetBundle.create({ 
                        bundle_id: bundle_id,
                        asset_id: user_asset.id,
                        payment_id: paid.id,
                        expire_start: Tools.bundle_expire_date({ total_days: bundle_info.serving_days, until_date: bundle_info.available_until },'start'),
                        expire_end: Tools.bundle_expire_date({ total_days: bundle_info.serving_days, until_date: bundle_info.available_until },'end'),
                        redeem_code: await Code_Generator.bundle_redeem_code({ digits: 6 })
                    })
                    try {
                        const promotion_id = product[8]
                        if (promotion_id) {
                            const asset_bundle_promotion = await AssetBundlePromotion.create({
                                asset_bundle_id: asset_bundle.id,
                                promotion_id: promotion_id
                            })
                        }
                    } catch (err) {
                        console.log(err);
                    }
                    
                    bundles.push(asset_bundle)
                    Email.basic_noti({
                        user_id: user_asset.user_id,
                        bundle_id: bundle_id,
                        asset_bundle: asset_bundle
                    },'การซื้อคูปอง')
                }
                console.log(`Creating Receipt for Refno ${refno}`);
                Email.create_receipt(refno, true)
                
                return response.send({ status: 'success', created: bundles})
            } else if (product[1] == 'Stack') {
                const stack_id = product[2]
                var stack = await Stack.find(stack_id)
                await stack.loadMany(['matches.services'])
                stack = stack.toJSON()

                const price_per_match = ((parseFloat(total)-sum_service)/stack.matches.length)
                var stack_payment = JSON.parse(stack.matches[0].payment)
                if (stack_payment.payment_multi) {
                    var updated = []
                    for (var i=0;i<stack.matches.length;i++) {
                        const update_match = await Match.find(stack.matches[i].id)
                        var add_price = 0
                        if (i==0) {
                            add_price = sum_service
                        }
                        await update_match.merge({ 
                            paid_amount: price_per_match + add_price,
                            deposit_amount: (price_per_match < update_match.total_price)? price_per_match:0
                        })
                        await update_match.save()

                        await MatchPayment.create({ match_id: update_match.id, payment_id: paid.id})
                        await update_match.load('payments')

                        updated.push(update_match)
                    }

                    return response.send({status : 'success', updated})
                } else {
                    const update_match = await Match.find(stack.matches[0].id)
                    await update_match.merge({ 
                        paid_amount: parseFloat(total)+parseFloat(update_match.paid_amount)
                    })
                    await update_match.save()

                    await MatchPayment.create({ match_id: update_match.id, payment_id: paid.id})

                    return response.send({status : 'success'})
                }
                
            } else if (product[1] == 'Match') {
                const match_id = product[2]
                const update_match = await Match.find(match_id)

                await update_match.merge({ 
                    paid_amount: parseFloat(total) + parseFloat(update_match.paid_amount),
                    deposit_amount: (parseFloat(total) < parseFloat(update_match.total_price))? parseFloat(total):0
                })
                await update_match.save()

                await MatchPayment.create({ match_id: update_match.id, payment_id: paid.id})

                var match = await Match.find(match_id)
                await match.loadMany(['user','court.court_type.provider_sport.provider'])
                match = match.toJSON()

                await Notification.notificationSender({matches: [match] , user: match.user},match.court.court_type.provider_sport.provider.id)
                
                Email.emailSender({
                    type: 'CreateMatch',
                    courts: [match.court_id],
                    user: (match.user)? { 
                        fullname: match.user.fullname,
                        phone_number: match.user.phone_number,
                        email: match.user.email,
                        lang: match.user.lang }:null, 
                    provider: (match.court.court_type.provider_sport.provider)? {
                        fullname: match.court.court_type.provider_sport.provider.fullname,
                        phone_number: match.court.court_type.provider_sport.provider.phone_number,
                        email: match.court.court_type.provider_sport.provider.email,
                        lang: match.court.court_type.provider_sport.provider.lang }:null,
                    match: [match],
                    matchday: true
                })

                return response.send({status : 'success'})
            } else if (product[1] == 'POS') {
                await UpdateOnPayment.pos_subscription(product[2], parseFloat(product[4]), product[6])

                return response.send({status : 'success', updated})
            } else {
                console.log('working on else');
                const match_id = parseFloat(refno)
                const update_match = await Match.find(match_id)

                await update_match.merge({ paid_amount: parseFloat(total)+parseFloat(update_match.paid_amount) })
                await update_match.save()

                await MatchPayment.create({ match_id: update_match.id, payment_id: paid.id})

                var match = await Match.find(match_id)
                await match.loadMany(['user','court.court_type.provider_sport.provider'])
                match = match.toJSON()
                
                await Notification.notificationSender({matches: [match] , user: match.user},match.court.court_type.provider_sport.provider.id)
                
                Email.emailSender({
                    type: 'CreateMatch',
                    courts: [match.court_id],
                    user: (match.user)? { 
                        fullname: match.user.fullname,
                        phone_number: match.user.phone_number,
                        email: match.user.email,
                        lang: match.user.lang }:null, 
                    provider: (match.court.court_type.provider_sport.provider)? {
                        fullname: match.court.court_type.provider_sport.provider.fullname,
                        phone_number: match.court.court_type.provider_sport.provider.phone_number,
                        email: match.court.court_type.provider_sport.provider.email,
                        lang: match.court.court_type.provider_sport.provider.lang }:null,
                    match: [match]
                })

                return response.send({status : 'success'})
            }
        } catch (err) {
            console.log(err);
        }
    }

    async paymentCheck ({ response, params }) {
        try {
            var payment = await Payment
                        .query()
                        .where('productdetail','like', '%'+params.detail+'%')
                        .first()
   
            if (payment) {
                return response.send({status: 'success', detail: payment})
            } else {
                return response.send({ status: 'fail', error: 'unpaid'})
            }
        } catch (err) {
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async get_refno ({ response, params }) {
        const product = params.product
        const res = await RefNo.GET.refno(product)

        return response.send({ product: product, refno: res })
    }

    async ref_is_paid({ response, params }) {
        try {
            var payment = await Payment.findBy('refno',params.refno)
            if (payment) {
                return response.send({status: 'success', detail: payment})
            } else {
                return response.send({ status: 'fail', error: 'unpaid'})
            }
        } catch (err) {
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async pos_receipt({ response, request }) {
        try {
            const { refno, bankno, matchday } = request.body
            await Email.create_pos_paid_receipt({ refno, bankno, matchday })

            return response.send({ status: 'success' })
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString()})
        }
    }
}

module.exports = PaymentController

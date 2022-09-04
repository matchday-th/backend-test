'use strict'

const { timeFormat } = require("../Helper")
const { Mutator, Checker, Creator, FindOrCreate, Code_Generator, RefNo, Tools, Email } = require("../Utility")

const Bundle = use('App/Models/Bundle')
const AssetBundle = use('App/Models/AssetBundle')
const ProviderSport = use('App/Models/ProviderSport')
const Database = use('Database')
const Provider = use('App/Models/Provider')
const UsedBundle = use('App/Models/UsedBundle')
const Payment = use('App/Models/Payment')
const BankTrx = use('App/Models/BankTransaction')
const AssetBundleBankTrx = use('App/Models/AssetBundleBankTransaction')
const moment = use('moment')

class BundleController {
    async create_bundle({ response, request, auth }) {
        try {
            const provider = await auth.getUser()
            request.body.provider_id = provider.id
            const bundle = await Bundle.create(request.body)

            return response.send({status: 'success', created: bundle})
        } catch (err) {
            const error_msg = err.toString().split(',').length-1
            return response.send({status: 'fail', error: err.toString().split(',')[error_msg]})
        }
    }

    async use_bundle({ response, request }) {
        try {
            const { code, method } = request.body
            const today = moment().format('e')
            var asset_bundle = await AssetBundle.findBy('redeem_code', code)
            await asset_bundle.loadMany(['used_bundles','bundle','asset'])
            asset_bundle = asset_bundle.toJSON()
            const provider_id = asset_bundle.bundle.provider_id
            
            if (asset_bundle.used_bundles.length < asset_bundle.bundle.code_limits) {
                if (method) {
                    //Do Something
                    return response.send({ status: 'fail', error: 'feature under develop'})
                } else {
                    if (asset_bundle.bundle.serving_dow) {
                        if (asset_bundle.bundle.serving_dow.includes(today)) {
                            const use_bundle = await UsedBundle.create({ asset_bundle_id: asset_bundle.id, provider_id: provider_id })
                            Email.basic_noti({
                                user_id: asset_bundle.asset.user_id,
                                bundle_id: asset_bundle.bundle_id,
                                asset_bundle_id: asset_bundle.id
                            },'การใช้คูปอง')

                            return response.send({ status: 'success', created: use_bundle})
                        } else {
                            return response.send({ status: 'fail', error: 'invalid code condition'})
                        }
                    } else {
                        const use_bundle = await UsedBundle.create({ asset_bundle_id: asset_bundle.id, provider_id: provider_id })
                        Email.basic_noti({
                            user_id: asset_bundle.asset.user_id,
                            bundle_id: asset_bundle.bundle_id,
                            asset_bundle_id: asset_bundle.id
                        },'การใช้คูปอง')

                        return response.send({ status: 'success', created: use_bundle})
                    }
                }
            } else {
                return response.send({ status: 'fail', error: 'code over use', bundle: asset_bundle})
            }
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async update_bundle({ response, params }) {
        try {
            const bundle = await Bundle.find(params.id)
            await bundle.merge(request.body)
            await bundle.save()

            return response.send({ status: 'success', updated: bundle})
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async check_bundle({ response, request, auth }) {
        try {
            const provider = await auth.getUser()
            const code = request.get().code
            var found_bundle = await AssetBundle
                .query()
                .where('redeem_code',code)
                .whereHas('bundle',(bundle) => {
                    bundle.where('provider_id',provider.id)
                })
                .with('bundle')
                .with('asset.user')
                .with('used_bundles')
                .with('payment')
                .pick(1)

            found_bundle = found_bundle.toJSON()[0]
            const result = {
                found: found_bundle.bundle,
                expiration: Checker.check_expiration(found_bundle),
                total: found_bundle.bundle.code_limits,
                used: found_bundle.used_bundles,
                user: found_bundle.asset.user,
                remaining: found_bundle.bundle.code_limits - found_bundle.used_bundles.length
            }

            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async index_bundle({ response, request }) {
        try {
            const params = request.get()
            const provider = params.provider
            const provider_id = params.provider_id
            const page = params.page
            const limit = params.limit

            var found_bundle = await Bundle
                .query()
                .where('deleted',0)
                .where(function() {
                    if (provider) {
                        this.whereHas('provider',(p) => {
                            p.where('name','like','%'+provider)
                        })
                    } else if (provider_id) {
                        this.where('provider_id',provider_id)
                    }
                })
                .with('provider.court_types.courts')
                .with('provider_sport.sport')
                .paginate(page,limit)

                found_bundle = found_bundle.toJSON()
                found_bundle.data.forEach(card => {
                    card.serving_dow = card.serving_dow.split(',')
                })

            return response.send(found_bundle)
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async get_bundle({ response, request, params }) {
        try {
            const bundle_id = params.bundle_id

            const bundle = await Bundle.find(bundle_id)
            await bundle.loadMany(['provider','provider_sport.sport'])

            return response.send(bundle)
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async history_bundle({ response, auth, params }) {
        try {
            const provider = await auth.getUser()
            var found_bundle = await UsedBundle
                .query()
                .where('provider_id',provider.id)
                .with('asset_bundle',(ab)=> {
                    ab.with('asset.user')
                    ab.with('payment')
                    ab.with('bundle')
                })
                .orderBy('created_at', 'desc')
                .paginate(params.page)

            var result = found_bundle.toJSON()
            result.data = result.data.map(used_bundle => used_bundle = {
                redeem_code: used_bundle.asset_bundle.redeem_code,
                user: used_bundle.asset_bundle.asset.user,
                created_at: used_bundle.created_at,
                clearing_status: used_bundle.clearing_status,
                clearing_amount: used_bundle.clearing_amount
            })

            return response.send(result)
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async get_bunle_payment_status({ request, response }) {
        try {
            const refno = request.get().refno
            var payment = await Payment
                .query()
                .where('refno',refno)
                .with('asset_bundle',ab => {
                    ab.with('bundle.provider')
                    ab.with('asset.user')
                })
                .fetch()

            return response.send({ status: 'success', payments: payment})
        } catch (err) {
            console.log(err);
            return response.status(500).send({ status: 'fail', error: err.toString()})
        }
    }

    async sale_bundle({ response, request }) {
        try {
            const {
                name,
                sport_id,
                detail,
                image,
                redeem_code,
                price,
                cusName,
                email,
                tel,
                sp,
                bank,
                bank_refno,
                pay_method,
                baseCode,
                serving_days,
                available_until,
                limit
            } = request.get()
    
            const user = await FindOrCreate.user_phoneOrEmail(cusName, tel, email)
            const user_asset = await FindOrCreate.user_asset(user.id)
            var provider = await Provider
                .query()
                .where('url_nickname','LIKE',`%${sp}`)
                .orWhere('fullname','LIKE',`%${sp}`)
                .with('photos')
                .fetch()
            provider = provider.toJSON()[0]
            var actions = []
            var provider_sport_id;
            if (sport_id) {
                provider_sport_id = await ProviderSport
                    .query()
                    .where('provider_id',provider.id)
                    .whereHas('sport',(s)=> {
                        s.where('id',sport_id)
                    })
                    .fetch()
                provider_sport_id = provider_sport_id.toJSON()[0].id
            }

            var bundle;
            bundle = await Bundle.findBy('base_code',baseCode? baseCode:redeem_code)
            if (!bundle) {
                bundle = await Bundle.create({
                    provider_id: provider.id,
                    provider_sport_id: provider_sport_id,
                    name: name? name:provider.fullname,
                    base_code: baseCode? baseCode:redeem_code,
                    detail: detail? detail:null,
                    code_limits: limit? limit:1,
                    price: price,
                    price_original: price*2,
                    image: image? image:(provider.photos.length>0? provider.photos[0].image:null),
                    serving_days: serving_days,
                    available_until: available_until
                })
                actions.push({ create_bundle: bundle})
            } else {
                actions.push({ found_bundle: bundle})
            }

            const refno = await Database
                        .table('asset_bundles')
                        .count('* as total')

            const asset_bundle = await AssetBundle.create({
                asset_id: user_asset.id,
                bundle_id: bundle.id,
                redeem_code: await Code_Generator.bundle_redeem_code({ digits: 6 }, redeem_code? redeem_code:false),
                expire_start: Tools.bundle_expire_date({ total_days: bundle.serving_days, until_date: bundle.available_until },'start'),
                expire_end: Tools.bundle_expire_date({ total_days: bundle.serving_days, until_date: bundle.available_until },'end'),
            })
            actions.push({ create_asset_bundle: asset_bundle })
    
            if (pay_method == 'bank') {
                var method;
                var bank_transaction = await BankTrx.findBy('refno',bank_refno)
                method = 'found'
                if (!bank_transaction) {
                    bank_transaction = await BankTrx.create({
                        user_id: user.id,
                        bank: bank,
                        refno: bank_refno,
                        amount: price
                    })
                    method = 'created'
                }
                actions.push({ bank_transaction: bank_transaction, method: method})
    
                const paid_bundle = await AssetBundleBankTrx.create({
                    asset_bundle_id: asset_bundle.id,
                    bank_transaction_id: bank_transaction.id
                })
                actions.push({ paid_bundle: paid_bundle})
            }
    
            return response.send({ status: 'success', actions: actions})
        } catch(err) {
            console.log(err);
            return response.send({ status: 'error', error: err.toString()})
        }
        
    }
}

module.exports = BundleController

'use strict'

const moment = use('moment')
const Match = use('App/Models/Match')
const Helper = require('../Helper.js')
const { Inventory } = require('../Loging.js')
const Utility = require('../Utility.js')
const ArenaLedger = use('App/Models/ArenaLedger')
const LedgerTransaction = use('App/Models/ArenaLedgerTransaction')
const Receipt = use('App/Models/Receipt')

class LedgerController {
    async getReport ({ response, request, auth }) {
        const timeFormat = 'YYYY-MM-DD HH:mm:ss'
        const { time_start, time_end } = request.body
        
        const half_month = moment(time_start,timeFormat).add(15,'days').subtract(1,'minutes').format(timeFormat)
        const half_end = moment(half_month,timeFormat).add(1,'minutes').format(timeFormat)

        const provider = await auth.getUser()
        const halfA = await provider
                        .provider_sports()
                        .with('sport')
                        .with('court_types', (ct) => {
                            ct.with('matches', (qb) => {
                                qb.where(function() {
                                    this.where('cancel',0)
                                    this.where('time_start','>=',time_start)
                                    this.where('time_end','<=',half_month)
                                })
                            })
                        })
                        .fetch()
        
        const halfB = await provider
                        .provider_sports()
                        .with('sport')
                        .with('court_types', (ct) => {
                            ct.with('matches', (qb) => {
                                qb.where(function() {
                                    this.where('cancel',0)
                                    this.where('time_start','>=',half_end)
                                    this.where('time_end','<=',time_end)
                                })
                            })
                        })
                        .fetch()

        var result = []
        result.push({data: halfA.toJSON().map(sport => {
            return {sport: sport.sport.name,
                    court_types: sport.court_types.map(court_type => {
                return {name: court_type.name,
                        matches: court_type.matches.map(match => {
                            return {id: match.id,
                                    // time_start: match.time_start,
                                    // time_end: match.time_end,
                                    total_price: match.total_price,
                                    paid_amount: match.paid_amount
                            }
                        })
                    }
            })}
        }),date: 15, isPaid: false })

        result.push({data: halfB.toJSON().map(sport => {
            return {sport: sport.sport.name,
                    court_types: sport.court_types.map(court_type => {
                return {name: court_type.name,
                        matches: court_type.matches.map(match => {
                            return {id: match.id,
                                    // time_start: match.time_start,
                                    // time_end: match.time_end,
                                    total_price: match.total_price,
                                    paid_amount: match.paid_amount
                            }
                        })
                    }
            })}
        }),date: 30, isPaid: false })

        return response.send(result)
    }

    async getPromotionReport ({ response, request, auth }) {
        const timeFormat = 'YYYY-MM-DD HH:mm:ss'
        const { time_start, time_end } = request.body
        
        const half_month = moment(time_start,timeFormat).add(15,'days').subtract(1,'minutes').format(timeFormat)
        const half_end = moment(half_month,timeFormat).add(1,'minutes').format(timeFormat)

        const provider = await auth.getUser()
        const halfA = await provider
                        .promotions()
                        // .where('expire_end','>=',time_start)
                        .with('matches', (qb) => {
                            qb.where(function() {
                                this.where('cancel',0)
                                this.where('time_start','>=',time_start)
                                this.where('time_end','<=',half_month)
                            })
                        })
                        .fetch()

        const halfB = await provider
                        .promotions()
                        // .where('expire_end','>=',time_start)
                        .with('matches', (qb) => {
                            qb.where(function() {
                                this.where('cancel',0)
                                this.where('time_start','>=',half_end)
                                this.where('time_end','<=',time_end)
                            })
                        })
                        .fetch()

        var result = []
        result.push({data: halfA.toJSON().map(promo => {
            return {name: promo.name,
                    value: promo.value,
                    used: promo.matches.length,
                    sum: promo.matches.length*promo.value}
        }),date: 15, isPaid: false })

        result.push({data: halfB.toJSON().map(promo => {
            return {name: promo.name,
                    value: promo.value,
                    used: promo.matches.length,
                    sum: promo.matches.length*promo.value}
        }),date: 30, isPaid: false })

        return response.send(result)
    }

    async getLedger({ response, request, auth }) {
        var { time_start, courts } = request.body
        const { start_at, total_weeks } = Utility.Mutator.month_ledger_counter('Saturday',time_start)
        const month = moment(time_start,Helper.timeFormat).format('YYYY-MM')
        const startDay = start_at

        const sp = await auth.getUser()
        var ledgers = await ArenaLedger
                                .query()
                                .where('date','LIKE',`${month}%`)
                                .where('provider_id', sp.id)
                                .with('arena_ledger_transaction')
                                .fetch()

        ledgers = ledgers.toJSON()

        var result = []
        for (var i=0;i<total_weeks;i++) {
            time_start = moment(startDay,Helper.timeFormat).add((i*7),'days').format(Helper.timeFormat)
            var time_end = moment(time_start,Helper.timeFormat).add(7,'days').subtract(1,'minutes').format(Helper.timeFormat)

            const receipt = await Receipt
                                .query()
                                .where('provider_id', sp.id)
                                .whereBetween('created_at', [time_start, time_end])
                                .fetch()

            const match = await Match
                .query()
                .whereIn('court_id',courts)
                .where('cancel',0)
                .where('deleted',0)
                .whereBetween('time_end', [time_start, time_end])
                .with('payments')
                .with('services')
                .with('inventories.item_type')
                .with('used_bundle.asset_bundle.bundle')
                .with('promotion')
                .fetch()

            const fee_ratio = 10
            // const fee_coupon = 10
            const revenue = [0,0]
            const online_match_list = [0,0]
            const fee = [0,0]
            
            const cash_services_list = [0,0]
            const online_services_list = [0,0]

            const cash_inventories_list = [0,0]
            const online_inventories_list = [0,0]

            const online_unpaid_list = [0,0]

            const { sum_in_array, excluded } = Utility.Calculation

            match.toJSON().forEach(m => {
                if (m.payments.length > 0 && !m.promotion && !m.used_bundle) {
                    const cal_paid_services = Utility.Calculation.sum_match_services(m.services,'online')
                    online_services_list.push(cal_paid_services)

                    const cal_online_inventories = Utility.Calculation.sum_match_inventories(m.inventories,'cash')
                    online_inventories_list.push(cal_online_inventories)

                    const is_paid_has_payment = sum_in_array(m.payments.map(p => parseFloat(p.total)),2)
                    online_match_list.push(is_paid_has_payment)
                    online_unpaid_list.push(m.total_price-is_paid_has_payment)
                    const cal_fee = ((parseFloat(is_paid_has_payment)*fee_ratio)/100)
                    fee.push(cal_fee)
                } else {
                    const cal_cash_inventories = Utility.Calculation.sum_match_inventories(m.inventories,'cash')
                    cash_inventories_list.push(cal_cash_inventories)
                }
                const cal_cash_services = Utility.Calculation.sum_match_services(m.services,'cash')
                cash_services_list.push(cal_cash_services)

                revenue.push(m.total_price)
            })
            const paid_pos = sum_in_array(receipt.toJSON().map(i => i.total_price),2)
            const cash_services = sum_in_array(cash_services_list,2)
            const cash_inventories = sum_in_array(cash_inventories_list,2)

            const online_inventories = sum_in_array(online_inventories_list,2)
            const online_services = sum_in_array(online_services_list,2)
            const online_unpaid = sum_in_array(online_unpaid_list,2)

            const online_matches = sum_in_array(online_match_list,2)
            const add_prices = sum_in_array([cash_services, paid_pos, cash_inventories],2)

            const total_revenue = sum_in_array(revenue,2)
            const paid_online = online_matches
            const paid_cash = total_revenue - paid_online + online_unpaid

            const paid_cash_service_paid = sum_in_array(cash_services_list,2) + sum_in_array(paid_pos,2) + sum_in_array(cash_inventories_list,2)
            const total_fee = sum_in_array(fee,2)

            const calculated_result = {
                week: i+1,
                date: `${time_start}`,
                date_end: `${time_end}`,
                revenue: total_revenue,
                paid_online: paid_online,
                paid_cash: paid_cash,
                paid_online_obj: {
                    total_paid:  paid_online,
                    paid_online: paid_online - online_services,
                    service_paid: online_services
                },
                paid_cash_obj: {
                    total_paid: paid_cash,
                    paid_cash: paid_cash - (sum_in_array(cash_services_list,2)+sum_in_array(cash_inventories_list,2)) + sum_in_array(paid_pos,2),
                    service_paid: paid_cash_service_paid,

                },
                fee: total_fee,
                pending_revenue: paid_online - total_fee,
                status: paid_online - total_fee == 0
            }
            
            result.push(calculated_result)

            if (ledgers.length == 4) {
                try {
                    var ledger = ledgers[i]
                    const id = ledger.id
                    const transaction = ledger.arena_ledger_transaction
                    ledger = calculated_result
                    ledger.pending_revenue = transaction? parseFloat(ledger.pending_revenue)-parseFloat(transaction.amount):ledger.pending_revenue
                    
                    const { week, date, revenue, paid_online, paid_cash, fee, pending_revenue } = ledger
                    const ledger_instance = await ArenaLedger.find(id)
                    await ledger_instance.merge({ week, date, revenue, paid_online, paid_cash, fee, pending_revenue })
                    await ledger_instance.save()

                    ledger.status = (ledger.pending_revenue == 0)
                } catch (err) {
                    console.log(err);
                }
            } else {
                const { week, date, revenue, paid_online, paid_cash, fee, pending_revenue } = calculated_result
                await ArenaLedger.create({ provider_id: sp.id, week, date, revenue, paid_online, paid_cash, fee, pending_revenue })
            }

        }

        return response.send(result)
    }

    async ledger_clearing({ response, request, params }) {
        try {
            const { bank, refno, amount, date, week } = request.body
            const ledger = await ArenaLedger
                                    .query()
                                    .where('date','LIKE',`${date}%`)
                                    .where('provider_id', params.sp_id)
                                    .where('week',week)
                                    .select(['id'])
                                    .first()
                                    
            if (ledger) {
                const paid = await LedgerTransaction.create({ arena_ledger_id: ledger.id, bank, refno, amount })

                return response.send({ status: 'success', paid_on: {week,date}, transaction: paid})
            } else {

                return response.send({ status: 'fail', msg: 'ledger not found'})
            }
        } catch (err) {
            console.log(err);
            return response.send({ status: 'fail', error: err.toString() })
        }
    }
}

module.exports = LedgerController

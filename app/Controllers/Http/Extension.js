/** Contains: @type {functions, variable} for Models Extension */

const User = use('App/Models/User')
const AssetBundle = use('App/Models/AssetBundle')

const Condition_helper = {
    activated_product(string) {
        return string.split(',')
    },
    activated_id(checking_id, allowed_ids) {
        return allowed_ids.split(',').includes(checking_id)
    },
    async first_buy({ email, phone_number }, product) {
        try {
            var proved_email = true
            var proved_phone = true

            if (email) {
                var user = await User.findBy('email',email)
                var asset_bundles = await Condition_helper.Query_product[product](user.id)
                proved_email = !(asset_bundles.length>0)
            }
            if (phone_number) {
                var user = await User.findBy('phone_number',phone_number)
                var asset_bundles = await Condition_helper.Query_product[product](user.id)
                proved_phone = !(asset_bundles.length>0)
            }
                
        } catch(err) {}

        return (proved_email && proved_phone)
    },
    Query_product: {
        async bundles (user_id) {
            var asset_bundle = await AssetBundle
                .query()
                .whereHas('asset',(asset)=> {
                    asset.where('user_id',user_id)
                })
                .with('bundle')
                .fetch()
            return asset_bundle.toJSON()
        }
    }
}

module.exports = {
    Promotion: {
        async in_condition({ email, phone_number, sport_id, user_id, provider_id }, condition) {
            var { active_provider_ids, active_user_ids, active_sport_ids, first_buy, active_products } = condition
            var proved_active_provider_ids = true
            var proved_active_user_ids = true
            var proved_active_sport_ids = true
            var proved_first_buy = true

            if (active_provider_ids) proved_active_provider_ids = Condition_helper.activated_id(provider_id, active_provider_ids)
            if (active_user_ids) proved_active_user_ids = Condition_helper.activated_id(user_id, active_user_ids)
            if (active_sport_ids) proved_active_sport_ids = Condition_helper.activated_id(sport_id, active_sport_ids)
            if (first_buy) proved_first_buy = await Condition_helper.first_buy({email, phone_number}, active_products)

            return (proved_active_provider_ids && proved_active_user_ids && proved_active_sport_ids && proved_first_buy)
        }
    }
}
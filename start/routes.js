'use strict'

const Utility = require("../app/Controllers/Http/Utility")
const DocHelper = require('../app/Controllers/Http/docHelper.js')
const Route = use('Route')
const Env = use('Env')

Route.get('/doc/:product', function ({ view, params }) {
    const APIs = {
        version: Utility.Version.api_version,
        list: DocHelper.groupRoute(Route.list(), params.product),
        helper: DocHelper
    }

    return view.render('api_doc', APIs)
})
Route.group(() => {
    Route.get('/delete-user', 'FacebookController.delete_user')

}).prefix('fb')

Route.group(() => {
    Route.get('/', 'NewsController.all_news')
    Route.get('/post/:id', 'NewsController.get_news')

}).prefix('news')

Route.post('/private-email-smi', '/FTI/FtiController.send_email_temp')
Route.get('/send-mail', '/Console/SystemController.sendMail')
Route.get('/view-mail', function ({ view }) {
    return view.render('email/actions/ResetPass', {
        id: 9999,
        provider: 'TEST_PROVIDER',
        day: '01/01/2020',
        time_start: '15:00',
        time_end: '16:00',
        courts: '1',
        total_price: 999,
        add_price: '-ไม่มี-',
        user: {
            fullname: 'TEST_USER',
            phone_number: '0555555555'
        },
        token: 'TOKEN123',
        fullname: 'TEST_RESETPASS'
    })
})

Route.group(() => {
    Route.get('/', 'RecruitTestController.test_api')
}).prefix('recruit')

Route.get('/', async function ({ response, request }) {
    const api_version = Utility.Version.api_version
    const database = Env.get('DB_CONNECTION')
    const status = Env.get('VERSION_STATUS')
    const product_serve = Env.get('PRODUCT_SERVE')

    return response.send({
        version: api_version,
        database: database,
        product_serve: product_serve,
        status: status
    })
})

Route.post('/admin-pass', '/Arena/ProviderController.generate_admin_token')//Get Token from Email
Route.post('/google-login', '/Core App/CoreUserController.genToken_google')//Get Token from Email
Route.post('/facebook-login', '/Core App/CoreUserController.genToken_facebook')//Get Token from Email
Route.post('/apple-login', '/Core App/CoreUserController.genToken_facebook')//Get Token from Email
Route.get('/get-provider', '/Mobile App/CoreProviderController.filterSP')//App Search
Route.get('/search-provider', '/Mobile App/CoreProviderController.searchSP')//Landing Page Search
Route.get('/request-otp', '/Console/SystemController.request_otp')
Route.post('/verify-otp', '/Console/SystemController.verify_otp')

Route.get('/pos-packages','/SaleController.sales_packages')

Route.group(()=> {
    Route.get('/resources/:sp_id','CalendarController.resources')/* Get Matches */
    Route.post('/matches/:sp_id','CalendarController.matches')/* Get Matches */

}).prefix('calendar')

//====================== Arena Controllers ★
//TC & Privacy
Route.post('tc-privacy-version', '/Arena/ArenaController.updateTcPrivacy').prefix('arena')
Route.post('accept-tc-privacy', '/Arena/ArenaController.acceptTcPrivacy').prefix('arena').middleware('auth:Arena')

//Arena Cores
Route.group(() => {
    Route.get('profile', '/Arena/ArenaController.getProfile')/* SP Profile */
    Route.put('profile', '/Arena/ArenaController.updateProfile')/* Update Profile */
    Route.post('free-courts', '/Arena/ArenaController.getFreeCourts')/* Free Court */
    Route.post('free-types', '/Arena/ArenaController.getFreeCourtsFromTypes')/* Free Court from Court Type */
    Route.post('check-match/:id', '/Arena/ArenaController.checkMatchToEdit')
    Route.post('/ledger', '/Arena/LedgerController.getLedger')/* Get Ledger */
    Route.post('/ledger-clearing/:sp_id', '/Arena/LedgerController.ledger_clearing')/* Get Ledger */

    Route.post('/allslot/:id/:type', '/Arena/ProviderController.allFreeSlot')//All Free Court from time

    Route.post('/fixed-time', '/Arena/ProviderController.createFixedTime')//All Free Court from time
    Route.put('/fixed-time', '/Arena/ProviderController.editFixedTime')//All Free Court from time


    Route.post('/add-player/:match_id', '/Arena/ArenaMatchController.addPlayer')/* Add player to Group Session */
    Route.delete('/kick-player/:room_id', '/Arena/ArenaMatchController.kickPlayer')/* Add player to Group Session */

    Route.post('matches', '/Arena/ArenaMatchController.monthlyMatches')/* Get Monthly Matches */
    Route.post('match-contact/:id', '/Arena/ArenaMatchController.addContact')/* add contact */
    Route.delete('match-contact/:id', '/Arena/ArenaMatchController.delContact')/* delete contact */
    Route.put('match-contact/:id', '/Arena/ArenaMatchController.editContact')/* edit contact */
    Route.post('create-match', '/Arena/ArenaMatchController.createMatch')/* Create Match */
    Route.put('match/:match_id', '/Arena/ArenaMatchController.editMatch')/* Update a match */
    Route.post('get-match-slip', '/Arena/ArenaMatchController.getSlip')/* Create Match */

    Route.delete('/stack/:id', 'MatchController.deleteStackSp_all')//Delete Matches in stack

    Route.get('/all-staff', '/Arena/StaffController.getStaff')// All staff
    Route.post('/create-staff', '/Arena/StaffController.createStaff')// Create Staff
    Route.put('/edit-staff/:id', '/Arena/StaffController.editStaff')// Edit and Delete Staff
    Route.delete('/delete-staff/:id', '/Arena/StaffController.deleteStaff')// Delete Staff

    Route.delete('unmember/:id', '/Arena/MemberController.unMember')
    Route.post('/service-status', '/Arena/ServiceController.get_services')
    Route.put('/service-update/:id','/Arena/ServiceController.update_service')
    Route.post('/service-create','/Arena/ServiceController.create_service')
    Route.delete('/service-remove/:service_id','/Arena/ServiceController.remove_service')
    Route.get('/all-services/:datetime','/Arena/ServiceController.get_service_provider') //Get Service Provider *params use yyyy-MM
    Route.get('/services-date/:datetime','/Arena/ServiceController.get_filter_date')//filter by date *params use yyyy-MM-dd
    Route.post('/service-for-use','/Arena/ServiceController.get_service_for_use')
    Route.post('/by-service','/Arena/ServiceController.by_service')

    Route.get('/score-board/:month','/Arena/ScoreBoardController.score_board') //params YYYY-MM
    Route.post('/daily_revenue','/Arena/ArenaController.getDailyRevenue').middleware('revenue') 
    Route.post('/daily_service','/Arena/ServiceController.daily_service').middleware('revenue')  

    Route.post('/uuid', '/Arena/ArenaController.uuid') //Save UUID
    Route.get('/alert_before_edit/:id', '/Arena/ArenaMatchController.alert_before_edit')
}).prefix('arena').middleware('auth:Arena')

Route.group(() => {
    Route.get('court-type', '/Arena/ArenaSettingController.def_sport')
    Route.post('court-type', '/Arena/ArenaSettingController.create_court_type')
    Route.put('court-type', '/Arena/ArenaSettingController.update_court_type')
    Route.delete('court-type', '/Arena/ArenaSettingController.delete_court_type')

    Route.get('check-court', '/Arena/ArenaSettingController.check_court')
    Route.get('check-court-type', '/Arena/ArenaSettingController.check_court_type')
    Route.get('sports', '/Arena/ArenaSettingController.index_sport')

    Route.post('slot-price', '/Arena/ArenaSettingController.create_slot_price')
    Route.put('slot-price', '/Arena/ArenaSettingController.update_slot_price')
    Route.delete('slot-price', '/Arena/ArenaSettingController.delete_slot_price')

    Route.resource('/price-list', '/Arena/ArenaOptionPriceController')
        .only(['index','store','update','destroy'])

    Route.post('get-to-new-type','/Arena/ArenaSettingController.getCourtTypeToNewFullcourt')
}).prefix('arena/settings').middleware('auth:Arena').middleware('check_demo')

Route.group(()=> {
    Route.get('/check-bundle', '/Store/BundleController.check_bundle')
    Route.get('/history-bundle/:page', '/Store/BundleController.history_bundle')
    Route.post('/use-bundle', '/Store/BundleController.use_bundle')

    Route.post('/create-bundle', '/Store/BundleController.create_bundle')
    Route.put('/update-bundle/:id', '/Store/BundleController.update_bundle')
}).prefix('store').middleware('auth:Arena').middleware('check_demo')

Route.group(()=> {
    Route.get('/index-bundle', '/Store/BundleController.index_bundle')
    Route.get('/get-bundle/:bundle_id', '/Store/BundleController.get_bundle')
    Route.get('/get-bundle-paid', '/Store/BundleController.get_bunle_payment_status')

    Route.get('/sale-bundle','/Store/BundleController.sale_bundle')

    Route.post('/check-promotion','/Store/PromotionController.check_promotion_with_email')
}).prefix('store')

Route.group(()=> {
    Route.post('user/all', '/Arena/ArenaDashboardController.user_all')
    Route.post('user/new', '/Arena/ArenaDashboardController.user_new')
    Route.post('user/data', '/Arena/ArenaDashboardController.user_data')
    Route.post('view/growth', '/Arena/ArenaDashboardController.view_growth')
    Route.post('confirm/rate', '/Arena/ArenaDashboardController.confirm_rate')
    Route.post('match/all', '/Arena/ArenaDashboardController.match_all')
    Route.post('match/abandon', '/Arena/ArenaDashboardController.match_abandon')
    Route.post('match/cancel', '/Arena/ArenaDashboardController.match_cancel')
    Route.post('match/abandon-rate', '/Arena/ArenaDashboardController.match_abandon_rate')
    Route.post('revenue/all', '/Arena/ArenaDashboardController.revenue_all')
    Route.post('revenue/rate', '/Arena/ArenaDashboardController.revenue_rate')
    Route.post('promotion/all', '/Arena/ArenaDashboardController.promotion_all')
    Route.post('promotion/used', '/Arena/ArenaDashboardController.promotion_used')
    Route.post('time/peak', '/Arena/ArenaDashboardController.time_peak')
    Route.post('time/cancel', '/Arena/ArenaDashboardController.time_cancel')

}).prefix('arena/dashboard').middleware('auth:Arena').middleware('check_demo')

Route.group(()=> {
    Route.post('free-courts', '/Arena/ArenaController.getFreeCourts')
}).prefix('sp')

Route.group(() => {
    Route.get('/get-sp', '/Landing Page/LandingPageController.index')//get all providers
    Route.get('/get-sp/:id', '/Landing Page/LandingPageController.getProvider')//get provider
    Route.post('/sp-address/:sp_id', '/Landing Page/LandingPageController.createAddress')//get all provider
    Route.post('/search-sp', '/Landing Page/LandingPageController.searchProvider') // search provider
    Route.get('/nearby-sp', '/Landing Page/LandingPageController.nearbyProvider') // find nearby providers
    Route.get('/recommended-sport', '/Landing Page/LandingPageController.recommendedSport') // find recommended sport
    Route.get('/review-sp', '/Landing Page/LandingPageController.reviewProvider') // find recommended sport
    Route.get('/all-location', '/Landing Page/LandingPageController.allLocation') // Get all location
    Route.get('/get-sp-reviews', '/Landing Page/LandingPageController.getProviderReviews') // Get reviews made by provider to matchday
}).prefix('public')



Route.group(() => {
    Route.post('getUser', '/Portal/PortalBookController.newPortalUser')//Check if user is registered
    Route.post('/user-for-payment', '/Portal/PortalBookController.user_for_payment')//Check if user is registered

    Route.get('getHistory/:id', '/Portal/PortalBookController.portalUserHistory')//get-myhistory
    Route.post('create-match', '/Portal/PortalBookController.portalCreateMatch')//create-match
    Route.delete('cancel-match/:id', '/Portal/PortalBookController.portalCancelMatch')//cancel-match
    Route.post('price/:court_id', '/Portal/PortalPriceController.court_price')//get court price

    Route.get('/pitches/:id', '/Arena/ProviderController.show')//See Profile
    Route.post('/my-matches/:sp', '/Arena/ProviderController.spMatches')//Public path all matches
    Route.post('/allslot/:id/:type', '/Arena/ProviderController.allFreeSlot')//All Free Court from time
    Route.post('/check-court', '/Portal/PortalBookController.portalCheckToEdit')//Check free court
    Route.put('/match/:id', '/Portal/PortalBookController.portalEditMatch')//Check free court

    Route.get('/allsports', '/Console/SystemController.allSport')//all Sports
}).prefix('portal')

Route.group(()=> {
    Route.get('/sp-index', '/Arena/ProviderController.index')// All Providers

    Route.resource('/matches', 'MatchController')
        .only(['index', 'show', 'update'])

    Route.get('/allsports', '/Console/SystemController.allSport')//all Sports
    Route.post('/check-phone', '/Console/SystemController.detectPhone')
    Route.post('/check-email', '/Console/SystemController.detectEmail')
    Route.post('/register', '/Mobile App/UserController.register') //Register    
    Route.post('/login-user', '/Mobile App/UserController.login') //Login
    Route.post('/reset-pass', '/Console/SystemController.resetPassword')
    Route.get('/my-promo','/Console/SystemController.my_promo_bundle')

    Route.post('create-match', '/Core App/CoreMatchController.create_match')//create-match
        
    Route.get('/home-sp', '/Mobile App/CoreProviderController.homeSP')
    Route.get('/index-sp', '/Mobile App/CoreProviderController.indexSP')
    Route.get('/home-event', '/Mobile App/MatchEventController.homeEvent')

    Route.post('/free-courts/:id', '/Mobile App/CoreProviderController.freeCourt')

    Route.resource('/friend', '/Mobile App/SocialController')
        .only(['index','show','update','destroy'])//CRUD Friends
}).prefix('core-app').middleware('auth:User')

//--- Blog 
Route.resource('/blog', '/Arena/BlogController')
    .only(['show', 'store', 'update', 'destroy'])
Route.post('/create-blog/:id', '/Arena/BlogController.createMock')

//--- Dashboard
Route.group(() => {
    Route.post('varUser/:sp', '/Arena/DashboardController.varUser')//Various Users
    Route.post('newUser/:sp', '/Arena/DashboardController.newUser')//New User form last month
    Route.post('allMatches/:sp', '/Arena/DashboardController.allMatches')//Matches Number
    Route.post('revenue/:sp', '/Arena/DashboardController.revenue')//Sum price from courts
    Route.post('sex/:sp', '/Arena/DashboardController.sex')//Client Sex
    Route.post('age/:sp', '/Arena/DashboardController.age')//Client Age
    Route.post('peaktime/:sp', '/Arena/DashboardController.peakTime')//Most using time
    Route.post('promotions/:sp', '/Arena/DashboardController.promotions')//Matches no promotion Number
    Route.post('canceled/:sp', '/Arena/DashboardController.canceled')//Matches canceled Number
}).prefix('data').middleware('auth:Arena').middleware('check_demo')

//--- Export
Route.post('/arena/my-matches-ex', '/Arena/ExportController.myMatches').middleware('auth:Arena').middleware('check_demo')//Get match for Export

//--- Ledger 
Route.post('/get-ledger', '/Arena/LedgerController.getReport').middleware('auth:Arena').middleware('check_demo')
Route.post('/get-promoreport', '/Arena/LedgerController.getPromotionReport').middleware('auth:Arena').middleware('check_demo')

//--- Package
Route.post('/package', '/Arena/PackageController.CreatePackage')
Route.post('/sub-plan', '/Arena/PackageController.subPlan')

//--- Provider
Route.post('/login-pitch', '/Arena/ProviderController.login_provider')// Login Provider
Route.get('/pitches', '/Arena/ProviderController.index').middleware('auth:User')// All Providers
Route.get('/profile-pitch', '/Arena/ProviderController.profile_provider').middleware('auth:Arena').middleware('check_demo') //Profile
Route.put('/profile-pitch', '/Arena/ProviderController.update').middleware('auth:Arena').middleware('check_demo') //Edit Profile
Route.get('/pitches/:id', '/Arena/ProviderController.show')//See Profile
Route.post('/pitch/summary','/Arena/ProviderController.pitchSummary').middleware('auth:Arena').middleware('check_demo')//Summary
//- Matches
Route.get('/my-matches', '/Arena/ProviderController.myMatches').middleware('auth:Arena').middleware('check_demo')//Non cancel-matches
Route.post('/my-matches/:sp', '/Arena/ProviderController.spMatches')//Public path all matches
Route.get('/sp-stacks', '/Arena/ProviderController.myStacks').middleware('auth:Arena').middleware('check_demo')//Non cancel-matches
Route.post('/free-courts/:id', '/Arena/ProviderController.freeCourt')//Free Court from time
Route.post('/free-courts2', '/Arena/ProviderController.getFreeCourt')//Free Court from provider id and list of court type id
Route.post('/get-cheapest-provider-court-type', '/Arena/ProviderController.getCheapestProviderCourtType') // find the cheapest price of provider
Route.post('/asap-free-courts/:id/:type', '/Arena/ProviderController.freeAsapCourt')//Asap Free Court from time
Route.post('/allslot/:id/:type', '/Arena/ProviderController.allFreeSlot')//All Free Court from time
Route.post('/create/:id', '/Arena/ProviderController.createMatch').middleware('auth:Arena').middleware('check_demo')//Create own matches
Route.delete('/delete/:id', '/Arena/ProviderController.deleteMatch').middleware('auth:Arena').middleware('check_demo')
Route.put('/move/:id', '/Arena/ProviderController.manageMatch').middleware('auth:Arena').middleware('check_demo')
Route.put('/edit-match/:id', '/Arena/ProviderController.editMatch').middleware('auth:Arena').middleware('check_demo')//Edit Match
//- Members
Route.get('/my-members', '/Arena/ProviderController.myMembers').middleware('auth:Arena').middleware('check_demo')// All Members
//- Promotion
Route.get('/my-promos', '/Arena/ProviderController.myPromotions').middleware('auth:Arena').middleware('check_demo')//Get Promotion
Route.post('/create-promo', '/Arena/ProviderController.createPromotion').middleware('auth:Arena').middleware('check_demo')//Create Promo
Route.put('/edit-promo/:id', '/Arena/ProviderController.editPromotion').middleware('auth:Arena').middleware('check_demo')//Del Promo
//- Group Session
Route.get('/my-gs', '/Arena/ProviderController.myGroupSession').middleware('auth:Arena').middleware('check_demo')//Non cancel-matches/ gs
Route.post('/my-gs/:id', '/Arena/ProviderController.addPlayer').middleware('auth:Arena').middleware('check_demo')//Non cancel-matches/ gs
Route.put('/my-gs/:id', '/Arena/ProviderController.editPlayer').middleware('auth:Arena').middleware('check_demo')//Non cancel-matches/ gs
//- Period Price
Route.post('/type-price', '/Arena/ProviderController.createTypePirce').middleware('auth:Arena').middleware('check_demo')//Custom period price
Route.put('/type-price/:id', '/Arena/ProviderController.editTypePirce').middleware('auth:Arena').middleware('check_demo')//Custom period price
Route.put('/court-type/:id', '/Arena/ProviderController.editCourtType').middleware('auth:Arena').middleware('check_demo')//Custom period price

//--- Staff
Route.get('/all-staff', '/Arena/StaffController.getStaff').middleware('auth:Arena').middleware('check_demo')// All staff
Route.post('/create-staff', '/Arena/StaffController.createStaff').middleware('auth:Arena').middleware('check_demo')// Create Staff
Route.put('/edit-staff/:id', '/Arena/StaffController.editStaff').middleware('auth:Arena').middleware('check_demo')// Edit and Delete Staff
Route.delete('/delete-staff/:id', '/Arena/StaffController.deleteStaff').middleware('auth:Arena').middleware('check_demo')// Delete Staff


//--- CusTomText
Route.get('get-text/:id','/Console/SystemController.getText')

//====================== SP Site Controllers
Route.post('/check-to-regis', '/SP Site/SPsiteController.checkToRegis')
Route.put('/fail-to-pay/:id', '/SP Site/SPsiteController.failPayment')



//====================== User Controllers
Route.post('/register', '/Mobile App/UserController.register') //Register
Route.post('/sso-account-register', '/Mobile App/UserController.ssoAccountRegister') //Sign up by single sign-on 
Route.post('/sso-account-login', '/Mobile App/UserController.ssoAccountLogin') //Log in by single sign-on
Route.post('/login-user', '/Mobile App/UserController.login') //Login
Route.post('/uuid', '/Mobile App/UserController.uuid') //Save UUID
Route.get('/my-profile', '/Mobile App/UserController.myProfile').middleware('auth:User') //Profile
Route.get('/my-profile-sp', '/Mobile App/UserController.myProfileinSP').middleware('auth:User') //Profile
Route.put('/my-profile', '/Mobile App/UserController.update').middleware('auth:User') //Edit/Update Profile
Route.get('/profile/:id', '/Mobile App/UserController.show').middleware('auth:User') //See Profile
Route.put('/finding', '/Mobile App/UserController.finding').middleware('auth:User') //Find Friend
Route.get('/my-booked', '/Mobile App/UserController.myBookings').middleware('auth:User') //See booked
Route.get('/my-joined', '/Mobile App/UserController.joinedBookings').middleware('auth:User') //See joined
Route.post('/my-ended', '/Mobile App/UserController.endedBookings').middleware('auth:User') //See ended
Route.post('/rate/:sp_id', '/Mobile App/UserController.matchRating').middleware('auth:User')//Rate match
Route.post('/promo/:sp_id', '/Mobile App/UserController.checkPromotion').middleware('auth:User')//Use Promo
Route.post('/be-member/:sp_id', '/Mobile App/UserController.beMember').middleware('auth:User')//be Member
Route.delete('/un-member/:sp_id', '/Mobile App/UserController.unMember').middleware('auth:User')//un Member



//====================== User-intereaction Controllers
Route.get('/follower/:id', '/Mobile App/FollowerController.checkFollower').middleware('auth:User')
Route.get('/following/:id', '/Mobile App/FollowerController.checkFollowing').middleware('auth:User')
Route.post('/follower/:id', '/Mobile App/FollowerController.store').middleware('auth:User')
Route.delete('/follower/:id', '/Mobile App/FollowerController.destroy').middleware('auth:User')



//====================== Match Controllers
Route.post('/matches/:id/join', 'MatchController.join').middleware('auth:User')
Route.delete('/matches/:id/leave', 'MatchController.leave').middleware('auth:User')
Route.post('/matches/:id/inv/', 'MatchController.inv').middleware('auth:User')
Route.delete('/matches/:id/kick/:uid', 'MatchController.kick').middleware('auth:User')
Route.resource('/matches', 'MatchController')
    .only(['index', 'show', 'update']).middleware('auth:User')
Route.post('/matches/:id', 'MatchController.store').middleware('auth:User')



//====================== Match Controllers *>>===== Stack Controllers
Route.get('/user-stack/:id', 'MatchController.getStackUser').middleware('auth:User')// All Providers
Route.post('/user-stack/:id/:weeks', 'MatchController.createStackUser').middleware('auth:User')
Route.delete('/user-stack/:id', 'MatchController.deleteStackUser_all').middleware('auth:User')
Route.delete('/user-stack/:id/each', 'MatchController.deleteStack_each').middleware('auth:User')
Route.get('/sp-stack/:id', 'MatchController.getStackSp').middleware('auth:Arena').middleware('check_demo')// All Providers
Route.post('/sp-stack/:id/:weeks', 'MatchController.createStackSp').middleware('auth:Arena').middleware('check_demo')//Create Stack
Route.delete('/sp-stack/:id', 'MatchController.deleteStackSp_all').middleware('auth:Arena').middleware('check_demo')//Delete Stack
Route.delete('/sp-stack/:id/each', 'MatchController.deleteStack_each').middleware('auth:Arena').middleware('check_demo')//Delete each one



//====================== User-Preference Controllers
Route.resource('/pref', '/Mobile App/PreferenceController')
    .only(['index', 'store', 'update', 'destroy']).middleware('auth:User')
Route.get('/roles', '/Mobile App/PreferenceController.allRoles').middleware('auth:User')
Route.post('/pref/:id/pick-roles', '/Mobile App/PreferenceController.pickRoles').middleware('auth:User')
Route.get('/sports', '/Console/MasterController.sport')


//====================== Chat Controllers
Route.get('/check-to-pushnoti/:id/:userid', '/Mobile App/ChatController.checkToPushNotification').middleware('auth:User')


//====================== Inventory Controllers
Route.group(()=>{
    Route.post('/inventory', '/Arena/InventoryController.createInventory')
    Route.put('/inventory/:inventory_id', '/Arena/InventoryController.updateInventory')
    Route.get('/inventory/:datetime', '/Arena/InventoryController.getInventory')//Get inventory Provider *params use yyyy-MM
    Route.get('/inventory-days/:datetime', '/Arena/InventoryController.getInventoryDOM')//Get inventory Provider *params use yyyy-MM
    Route.get('/inventory-date/:datetime', '/Arena/InventoryController.getFilterDate') //filter by date *params use yyyy-MM-dd
    Route.get('/inventory-history', '/Arena/InventoryController.getHistory')
    Route.get('/inventory-summary-history', '/Arena/InventoryController.getSummaryHistory')
    Route.delete('/inventory/:inventory_id', '/Arena/InventoryController.removeInventory')
    Route.post('/create-receipt', '/Arena/InventoryController.createReceipt')
    Route.get('/receipt-history/:date', '/Arena/InventoryController.receiptHistory')
    Route.put('/pay-receipt/', '/Arena/InventoryController.payReceipt')
    Route.get('/by-history/:date', '/Arena/InventoryController.byHistory')
    Route.delete('/used_inventory/:id', '/Arena/InventoryController.removeUsedInventory')
    Route.post('/item-type', '/Arena/InventoryController.createItemType')
    Route.put('/item-type/:id', '/Arena/InventoryController.updateItemType')
    Route.delete('/item-type/:id', '/Arena/InventoryController.removeItemType')
    Route.delete('/remove-refill/:id', '/Arena/InventoryController.removeRefill')
    Route.get('/inventory-price-history', '/Arena/InventoryController.priceHistory')
    Route.post('/payment-etc','/Arena/InventoryController.createPaymentEtc') //create payment-etc
    Route.get('/payment-etc/:date','/Arena/InventoryController.getPaymentEtc') //filter by date *params use yyyy-MM-dd
    Route.delete('/payment-etc/:id', '/Arena/InventoryController.removePaymentEtc')
    Route.get('/discounts', '/Arena/InventoryController.getDiscountType')
    Route.get('/discount-history/:datetime', '/Arena/InventoryController.getDiscountHistory')//*params use yyyy-MM
    Route.get('/item-history/:id','/Arena/InventoryController.itemHistory')
    Route.get('/item-types','/Arena/InventoryController.getAllItemType')
}).prefix('arena').middleware('auth:Arena')


//====================== Console Controllers ★
//--- System 
Route.get('/allsports', '/Console/SystemController.allSport').middleware('auth:User') //all Sports
Route.post('/reset-pass', '/Console/SystemController.resetPassword')
Route.post('/set-newpass', '/Console/SystemController.setPassword')
Route.post('/checkweeks', '/Console/SystemController.checkLongbook') //Check longbook available
Route.post('/check-fullname', '/Console/SystemController.detectFullname')
Route.post('/check-phone', '/Console/SystemController.detectPhone')
Route.post('/check-email', '/Console/SystemController.detectEmail')
Route.post('/check-username', '/Console/SystemController.detectUsername')

//--- Payment
Route.post('/payment', '/Console/PaymentController.payment')
Route.get('/payment-check/:detail', '/Console/PaymentController.paymentCheck')

Route.get('/payment/refno/:product', '/Console/PaymentController.get_refno')
Route.get('/payment/check/:refno', '/Console/PaymentController.ref_is_paid')

Route.post('/send-pos-receipt', '/Console/PaymentController.pos_receipt')
//--- Settings
Route.get('/pref-text-limit', '/Console/SettingController.prefLimit')//all Sports
Route.post('/add-rude', '/Console/SettingController.addRudeWord')

//--- Tool API
Route.get('/confirm/:id', '/Console/MasterController.callConfirm')

//====================== Master Controllers ★
Route.group(() => {
    //--- Sport
    Route.get('sports', '/Console/MasterController.sport')
    Route.post('sports', '/Console/MasterController.createSport')
    Route.put('sports/:id', '/Console/MasterController.editSport')

    //--- Role
    Route.get('roles/:id', '/Console/MasterController.role')
    Route.post('roles/:id', '/Console/MasterController.createRole')
    Route.put('roles/:id', '/Console/MasterController.editRole')
    Route.delete('roles/:id', '/Console/MasterController.deleteRole')

    //--- Facility
    Route.get('facilities', '/Console/MasterController.facility')
    Route.post('facilities', '/Console/MasterController.createFacility')
    Route.put('facilities/:id', '/Console/MasterController.editFacility')
    Route.delete('facilities/:id', '/Console/MasterController.deleteFacility')

    //--- Promotion
    Route.get('promotions/:id', '/Console/MasterController.promotion')
    Route.post('promotions', '/Console/MasterController.createPromotion')
    Route.put('promotions/:id', '/Console/MasterController.editPromotion')
    Route.delete('promotions/:id', '/Console/MasterController.deletePromotion')

    //--- Provider
    Route.get('providers/:id', '/Console/MasterController.providers')
    Route.post('providers', '/Console/MasterController.createProvider')
    Route.put('providers/:id', '/Console/MasterController.updateProvider')
    Route.delete('providers/:id', '/Console/MasterController.deleteProvider')

    //--- Provider Sport
    Route.post('providers/sport/:id', '/Console/MasterController.providerSport')
    Route.put('providers/sport/:id', '/Console/MasterController.providerEditSport')
    Route.delete('providers/sport/:id', '/Console/MasterController.providerDeleteSport')

    //--- Provider Service
    Route.post('providers/service/:id', '/Console/MasterController.createService')
    Route.put('providers/service/:id', '/Console/MasterController.editService')
    Route.delete('providers/service/:id', '/Console/MasterController.deleteService')

    //--- Provider Facility
    Route.post('providers/facility', '/Console/MasterController.providerFacility')
    Route.delete('providers/facility/:id', '/Console/MasterController.providerDeleteFacility')

    //--- Provider Rating
    Route.post('providers/rating', '/Console/MasterController.providerRating')
    Route.delete('providers/rating/:id', '/Console/MasterController.providerDeleteRating')

    //--- Provider Photo
    Route.post('providers/photo/:id', '/Console/MasterController.createPhoto')
    Route.put('providers/photo/:id', '/Console/MasterController.editPhoto')
    Route.delete('providers/photo/:id', '/Console/MasterController.deletePhoto')

    //--- Provider Court Type
    Route.post('providers/type/:id', '/Console/MasterController.createType')
    Route.put('providers/type/:id', '/Console/MasterController.editType')
    Route.delete('providers/type/:id', '/Console/MasterController.deleteType')

    //--- Provider Court
    Route.post('providers/court/:id', '/Console/MasterController.createCourt')
    Route.put('providers/court/:id', '/Console/MasterController.editCourt')
    Route.delete('providers/court/:id', '/Console/MasterController.deleteCourt')

    //--- Provider BusinessTime
    Route.post('providers/bustime/:id', '/Console/MasterController.createBusTime')
    Route.put('providers/bustime/:id', '/Console/MasterController.editBusTime')
    Route.delete('providers/bustime/:id', '/Console/MasterController.deleteBusTime')

    //--- Provider PeriodPrice
    Route.post('providers/periodprice/:id', '/Console/MasterController.createPeriodPrice')
    Route.get('providers/use-periodprice/:id', '/Console/PeriodPriceController.getAllPeriodType')
    Route.post('providers/use-periodprice/:id', '/Console/PeriodPriceController.store')
    Route.put('providers/periodprice/:id', '/Console/MasterController.editPeriodPrice')
    Route.delete('providers/periodprice/:id', '/Console/MasterController.deletePeriodPrice')
}).prefix('master').middleware('pos')

// Route.post('bulk/court-type', '/Console/MasterController.reset_court_type_price')


//====================== FTI Controllers ★
Route.group(() => {
    Route.get('all-sp', '/FTI/FtiController.getAllSP')//get all SP
    Route.get('sp/:id', '/FTI/FtiController.getEachSP')//get a SP
    Route.get('allsports', '/FTI/FtiController.allSport') //all Sports
}).prefix('fti').middleware('fti')

//========================= email test

Route.get('/email/receipt/:refno', function ({ view, params, request }) {
    Utility.Email.create_receipt(params.refno,request.get().viewer)
    // Utility.Email.basic_noti({
    //     user_id: 1,
    //     bundle_id: 11,
    //     asset_bundle_id: 20
    // },'การซื้อ')
    // Utility.Email.create_pos_paid_receipt({ refno: params.refno, matchday:true })
})
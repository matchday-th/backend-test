const moment = use('moment')
const dateFormat = 'D MMM Y'
const timeFormat = 'HH:mm'
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
const Utility = require('./Utility.js');
const Helper = require('./Helper.js');


const Court = use('App/Models/Court')
const CourtType = use('App/Models/CourtType')
const TimeSlot = use('App/Models/TimeSlot')

const ArenaSetting = {
    Calculate:{
  
    },
    Create:{
    },
    Update :{
        async update_court({court_id, data}){
            const update_court = await Court.find(court_id)
            await update_court.merge(data)
            await update_court.save()
            return update_court
        }
    }


}
module.exports = ArenaSetting;
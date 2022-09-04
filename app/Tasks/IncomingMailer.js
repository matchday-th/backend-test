'use strict'

const Task = use('Task')
const Match = use('App/Models/Match')
const moment = use('moment')
const Mail = use('Mail')

class IncomingMailer extends Task {
  static get schedule () {
    return '*/30 * * * *'
  }

  async handle () {

    // let time_a = moment().startOf('hour')
    // let time_b = moment(time_a).add(2,'hours')
    // try {
    //   const matches = await Match
    //                     .query()
    //                     .where('cancel',0)
    //                     .whereNot('user_id',null)
    //                     .where('call_confirm',0)
    //                     .whereBetween('time_start',[time_a._d,time_b._d])
    //                     .with('user')
    //                     .with('court.court_type.provider_sport.provider')
    //                     .fetch()
  
    //   const res = matches.toJSON()

    //   var mails = []
    //   var i;
    //   for (i=0;i<res.length;i++) {
    //     await Mail.raw(
    //       `<h1>[Coming UP] Booking ID:${res[i].id}</h1>
    //       <h1>${res[i].court.court_type.provider_sport.provider.fullname}</h1>
    //       <h2>${res[i].user.fullname} - <a href="tel:${res[i].user.phone_number}">${res[i].user.phone_number}</a></h2>
    //       <h3>Match Start: ${res[i].time_start}</h3>
    //       <h3>price : ${res[i].court.price}</h3>
    //       <a href="https://api-matchday-hub.appspot.com/confirm/${res[i].id}">Click here when you called</a>
    //       `, (message) => {
    //           message.from('booking.matchday@gmail.com')
    //           // message.from('matchday.th@gmail.com')
    //           message.to('booking.matchday@gmail.com')
    //           message.subject(`Booking ID:${res[i].id}`)
    //       })
    //       mails.push(res[i].id)
    //   }} catch (err) {
    //     console.log(err);
    // }
    // console.log(`== IncomingMailer == ${time_a} Sent ${mails.length} Mails`);
    
  }
}

module.exports = IncomingMailer

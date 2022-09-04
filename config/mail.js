'use strict'

module.exports = {
  /*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | Connection to be used for sending emails. Each connection needs to
  | define a driver too.
  |
  */
  connection: 'smtp',

  /*
  |--------------------------------------------------------------------------
  | SMTP
  |--------------------------------------------------------------------------
  |
  | Here we define configuration for sending emails via SMTP.
  |
  */
  smtp: {
    driver: 'smtp',
    pool: false,
    port: 465,
    host: 'smtp.gmail.com',
    secure: true,
    tls : {
      rejectUnauthorized : false
    },
    /* เมลส่ง Production */
    auth: {
      user: 'booking.matchday@gmail.com',
      pass: 'hjrshpruzgezadfw'
    }
  }
}

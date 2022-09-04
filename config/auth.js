'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
  
  authenticator: 'User',
  User: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'username',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      subject: "User"
    }
  },
  UserMail: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'email',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      subject: "User"
    }
  },
  UserPhone: {
    serializer: 'lucid',
    model: 'App/Models/User',
    scheme: 'jwt',
    uid: 'phone_number',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      subject: "User"
    }
  },
  Arena: {
    serializer: 'lucid',
    model: 'App/Models/Provider',
    scheme: 'jwt',
    uid: 'email',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      subject: "Arena"
    }
  },
  ArenaPhone: {
    serializer: 'lucid',
    model: 'App/Models/Provider',
    scheme: 'jwt',
    uid: 'phone_number',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      subject: "Arena"
    }
  },
  Staff: {
    serializer: 'lucid',
    model: 'App/Models/Staff',
    scheme: 'jwt',
    uid: 'username',
    password: 'password',
    options: {
      secret: Env.get('APP_KEY'),
      subject: "Staff"
    }
  },
}

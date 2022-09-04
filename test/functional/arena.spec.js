'use strict'

const { test, trait } = use('Test/Suite')('Arena')
const ArenaEndpoint = require('../endpoints/Arena.js')
const prefix = '/arena'

trait('Test/ApiClient')

test('Arena-getProfile', async ({ client }) => {

  const response = await client
    .get(prefix+'/profile')
    .header('Authorization',`Bearer ${ArenaEndpoint.Token}`)
    .end()

  response.assertStatus(200)
})
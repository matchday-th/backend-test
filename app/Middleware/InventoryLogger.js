'use strict'

class InventoryLogger {
  async handle ({ request, auth }, next) {
    //TODO Update transaction
    const { username } = await auth.getUser()
    console.log(`${username} is Updating...`);
    
    await next()
  }
}

module.exports = InventoryLogger

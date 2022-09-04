'use strict'

class Created_at_only {
  register (Model) {
    Object.defineProperties(Model, {
      updatedAtColumn: {
        get: () => null,
      }
    })
  }
}

module.exports = Created_at_only

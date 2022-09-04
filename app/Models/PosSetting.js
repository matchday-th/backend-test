'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PosSetting extends Model {
    static get hidden () {
        return ['topic','id','package_id']
    }
}

module.exports = PosSetting

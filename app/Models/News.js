'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class News extends Model {
    static boot() {
        super.boot()
        this.addHook('afterFind', async (news) => {
            await news.merge({ views: news.views+1 })
            await news.save()
        })
        
    }

    contents() {
        return this.hasMany('App/Models/NewsContent')
    }
}

module.exports = News

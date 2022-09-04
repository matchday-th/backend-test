'use strict'

const News = use('App/Models/News')
const NewsContent = use('App/Models/NewsContent')


class NewsController {
    async all_news ({ response }) {
        var all_news = await News
            .query()
            .where('hidden', 0)
            .with('contents')
            .fetch()

        all_news = all_news.toJSON()
        all_news.forEach(news => {
            news.sub_topic = news.contents[0].text
            news.cover = news.contents[0].photo
        })

        return response.send({ status: 'ok', articles: all_news })
    }

    async get_news ({ response, params }) {
        const news = await News
            .query()
            .where('hidden', 0)
            .where('id', params.id)
            .with('contents')
            .first()

        return response.send(news)
    }
}

module.exports = NewsController

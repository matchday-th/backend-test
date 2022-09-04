'use strict'

const Blog = use('App/Models/Blog')

class BlogController {

  async store ({ request, response, auth }) {
    const { topic, detail, image } = request.body
    try {
      const sp = await auth.authenticator('Arena').getUser()

      var blog = new Blog()
      blog.provider_id = sp.id
      blog.topic = topic
      blog.detail = detail
      blog.image = image

      await blog.save()
      return response.send({status: 'success', blog: blog})

    } catch (err) {
      
      return response.send({status: 'fail', error: err.toString()})
    }
  }

  async show ({ params, request, response }) {
    try {
      const blog = await Blog.find(params.id)
      return response.send({status: 'success', blog: blog})

    } catch (err) {

      return response.send({status: 'fail', error: err.toString()})
    }
  }

  async update ({ params, request, response }) {
    const blog = await Blog.find(params.id)
    try {
      await blog.merge(request.body)
      await blog.save()

      return response.send({status: 'success', blog: blog})

    } catch (err) {

      return response.send({status: 'fail', error: err.toString()})
    }
  }

  async destroy ({ params, request, response }) {
    const blog = await Blog.find(params.id)
    try {
      await blog.delete()

      return response.send({status: 'success' })

    } catch (err) {

      return response.send({status: 'fail', error: err.toString()})
    }
  }

  async createMock ({ params, request, response }) {
    const { topic, detail, image } = request.body
    try {
      var blog = new Blog()
      blog.provider_id = params.id
      blog.topic = topic
      blog.detail = detail
      blog.image = image

      await blog.save()
      return response.send({status: 'success', blog: blog})

    } catch (err) {
      
      return response.send({status: 'fail', error: err.toString()})
    }
  }
}

module.exports = BlogController

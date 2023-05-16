/* eslint-disable no-unused-vars */
const { request, response } = require('express')
const express = require('express')
const app = express()

const { User } = require('./models')

const bodyParser = require('body-parser')
app.use(bodyParser.json())

app.get('/',async (request, response) => {
    response.send("signup")
})

app.post('/users', async (request, response) => {
    try {
      const user = await User.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: request.body.password,
        role:request.body.role
      })

    } catch (error) {
      console.log(error)
      response.redirect('/')
    }
  })
  

module.exports = app
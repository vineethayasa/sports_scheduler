/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { request, response } = require('express')
const express = require('express')
const app = express()

const { User } = require('./models')

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const path = require('path')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/',async (request, response) => {
    response.render("index")
})

app.get('/signup', (request, response) => {
    response.render('signup')
})
app.get('/login', (request, response) => {
    response.render('login')
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
      return response.json(user)
    } catch (error) {
      console.log(error)
      response.redirect('/')
    }
  })
  

module.exports = app
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { request, response } = require('express')
const express = require('express')
const app = express()

const { User } = require('./models')

app.use(express.urlencoded({ extended: false }))

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

app.get('/users', async (request, response) => {
    try {
        const users = await User.findAll();
        return response.send(users);
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
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
    return response.redirect('/')
    } catch (error) {
      console.log(error)
      return response.status(201).json({ message: 'error' });

    }
  })
// app.post('/users', async (request, response) => {
//   try {
//     const user = await User.addUser({
//       firstName: request.body.firstName,
//       lastName: request.body.lastName,
//       email: request.body.email,
//       password: request.body.password,
//       role: request.body.role
//     });
//     return response.status(201).json({ message: 'User created successfully' });
//   } catch (error) {
//     console.log(error);
//     return response.status(500).json({ error: 'Internal server error' });
//   }
// });


module.exports = app
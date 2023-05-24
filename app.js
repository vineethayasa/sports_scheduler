/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const { request, response } = require('express')
const express = require('express')
const app = express()
const csrf = require('tiny-csrf')

const { User, Sport } = require('./models')

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const passport = require('passport')
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const LocalStrategy = require('passport-local')

const bcyrpt = require('bcrypt')
const saltRounds = 10

const flash = require('connect-flash')

app.use(express.urlencoded({ extended: false }))
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(flash())
const user = require('./models/user')
const sport = require('./models/sport')

app.use(bodyParser.json())
app.use(cookieParser('ssh!!!! some secret string'))
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']))

app.use(session({
  secret: 'this is my secret-258963147536214',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.use(passport.initialize())
app.use(passport.session())
app.use((request, response, next) => {
  response.locals.messages = request.flash()
  next()
})

passport.use(new LocalStrategy({
  usernameField: 'email',
  password: 'password'
}, (username, password, done) => {
  User.findOne({ where: { email: username } })
    .then(async (user) => {
      const result = await bcyrpt.compare(password, user.password)
      if (result) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Invalid Password' })
      }
    }).catch((error) => {
      return done(null, false, { message: 'Invalid user credentials' })
    })
}))

passport.serializeUser((user, done) => {
  console.log('Serializing user in session', user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch(error => {
      done(error, null)
    })
})

app.get('/', async (request, response) => {
  response.render('index', { csrfToken: request.csrfToken() })
})

app.get('/signup', (request, response) => {
    response.render('signup', { csrfToken: request.csrfToken() })
})
app.get('/login', (request, response) => {
    response.render('login', { csrfToken: request.csrfToken() })
})

app.get('/signout', (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err)
    }
    response.redirect('/')
  })
})

app.get('/home', (request, response) => {
  response.render('home', {
    name: request.body.firstName,
    role:request.body.role,
    csrfToken: request.csrfToken()
  })
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

app.post('/session', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), async (request, response) => {
  console.log(request.user)
  response.redirect('/home')
})

app.post('/users', async (request, response) => {
    if (!request.body.firstName) {
      request.flash('error', 'First Name cannot be empty')
      return response.redirect('/signup')
    }
    if (!request.body.email) {
      request.flash('error', 'Email cannot be empty')
      return response.redirect('/signup')
    }
  
    if (!request.body.password) {
      request.flash('error', 'Password cannot be empty')
      return response.redirect('/signup')
    }
    const hashedPwd = await bcyrpt.hash(request.body.password, saltRounds)
    console.log(hashedPwd)
    try {
      const user = await User.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: hashedPwd,
        role:request.body.role
      })
      request.login(user, (err) => {
        if (err) {
          console.log(err)
          response.redirect('/')
        }
        response.redirect('/home')
      })
    } catch (error) {
      console.log(error)
      request.flash('error', error.errors[0].message)
      response.redirect('/signup')
    }
})

app.get('/sport',async (request, response) => {
  response.render('new_sport', { csrfToken: request.csrfToken() })
})


app.post('/sport', async (request, response) => {
  if (!request.body.sport_name) {
    request.flash('error', 'Sport name cannot be empty')
    return response.redirect('/sport')
  }
  try {
    const sport = await Sport.create({
      sport_name: request.body.sport_name,
    })
    response.redirect('/sportsession')
  } catch (error) {
    console.log(error)
    request.flash('error', error.errors[0].message)
    response.redirect('/sport')
  }
})

module.exports = app
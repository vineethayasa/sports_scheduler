/* eslint-disable no-unused-vars */
const { request, response } = require('express')
const express = require('express')
const app = express()
const csrf = require('tiny-csrf')

const { User, Sport ,Session } = require('./models')

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

app.get('/home', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedinUser = request.user.id;
  const currentuser = await User.getUser(loggedinUser)
  const sportsnames = await Sport.getSports()
  response.render('home', {
    currentuser,
    sportsnames,
    csrfToken: request.csrfToken()
  })
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
      const user = await User.addUser({
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

app.get('/sport',connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  response.render('new_sport', { csrfToken: request.csrfToken() })
})
app.get('/sportsession/:sport_name',connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const data = await User.getAllUsers()
  const current_sport_name = request.params.sport_name
  response.render('sportsessions', { data,current_sport_name, csrfToken: request.csrfToken() })
})
app.get('/sport_main/:id',connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log(request.params.id)
  const current_sport = await Sport.getSportById(request.params.id)
  console.log(current_sport.sport_name)
  response.render('sport_main', { current_sport, csrfToken: request.csrfToken() })
})

app.post('/sport', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  if (!request.body.sport_name) {
    request.flash('error', 'Sport name cannot be empty')
    return response.redirect('/sport')
  }
  try {
    const sport = await Sport.addSport({
      sport_name: request.body.sport_name,
      userId:request.user.id
    })
    console.log(sport.sport_name)
    console.log(sport)
    response.redirect('/home')
  } catch (error) {
    console.log(error)
    request.flash('error', error.errors[0].message)
    response.redirect('/sport')
  }
})

app.post('/sportsession', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const sport = await Sport.getSportByName(request.body.name)
  try {
    const session = await Session.addSession({
      
      name: request.body.name,
      date: request.body.date,
      address: request.body.address,
      players: request.body.players,
      count:request.body.count,
      cancelled:false,
      sportId:sport.id,
      userId:request.user.id
      
    })
    console.log(session)
    response.redirect('/signup')
  } catch (error) {
    console.log(error)
    response.redirect('/')
  }
})
app.get('/allsessions', async (request, response) => {
  try {
      const sessions = await Session.findAll();
      return response.send(sessions);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
})
module.exports = app
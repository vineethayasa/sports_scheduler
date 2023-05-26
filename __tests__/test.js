/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require('supertest')
const cheerio = require('cheerio')

const db = require('../models/index')
const app = require('../app')

let server, agent

function extractCsrfToken (res) {
  const $ = cheerio.load(res.text)
  return $('[name=_csrf]').val()
}

const login = async (agent, username, password) => {
  let res = await agent.get('/login')
  const csrfToken = extractCsrfToken(res)
  res = await agent.post('/session').send({
    email: username,
    password,
    _csrf: csrfToken
  })
}

describe('Sports Scheduler', function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
    server = app.listen(process.env.PORT || 5000, () => {})
    agent = request.agent(server)
  })
  afterAll(async () => {
    try {
      await db.sequelize.close()
      await server.close()
    } catch (error) {
      console.log(error)
    }
  })

  test('Sign Up', async () => {
    let res = await agent.get('/signup')
    const csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Vineetha',
      lastName: 'Reddy',
      email: 'vineetha@gmail.com',
      role:'Player',
      password: 'abcd',
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302)
  })
})
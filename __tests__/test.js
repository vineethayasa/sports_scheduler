/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password,
    _csrf: csrfToken,
  });
};

describe("Sports Scheduler", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(process.env.PORT || 5000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign Up as Admin", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Vineetha",
      lastName: "Reddy",
      email: "vineetha@gmail.com",
      role: "Player",
      password: "abcd",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Login as Admin", async () => {
    let res = await agent.get("/login");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: "vineetha@gmail.com",
      password: "abcd",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test('Creating a sport as Admin', async () => {
    const agent = request.agent(server)
    await login(agent, 'vineetha@gmail.com', 'abcd')
    const res = await agent.get('/sport')
    const csrfToken = extractCsrfToken(res)
    const response = await agent.post('/sport').send({
      sport_name: 'Rugby',
      _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302)
  })
  test('Creating a session as Admin', async () => {
    const agent = request.agent(server)
    await login(agent, 'vineetha@gmail.com', 'abcd')
    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);
    const url=`/sportsession/Rugby`
    const res = await agent.get(url)
    const csrfToken = extractCsrfToken(res)
    const date_today = new Date();
    const response = await agent.post('/sportsession').send({
        name: 'Rugby',
        date: date_today,
        address: 'Parade Ground',
        players: ["1","3","4"],//id of players since there maybe multiple people with same name
        count: 4,
        cancelled: false,
       _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302) 
  })
  test("Sign out as Admin", async () => {
    let res = await agent.get('/home')
    expect(res.statusCode).toBe(200)
    res = await agent.get('/signout')
    expect(res.statusCode).toBe(302)
    res = await agent.get('/home')
    expect(res.statusCode).toBe(302)
  })
  test("Sign Up as Player", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Srinivas",
      lastName: "Reddy",
      email: "srinivas@gmail.com",
      role: "Admin",
      password: "abcd",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Login as Player", async () => {
    let res = await agent.get("/login");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: "srinivas@gmail.com",
      password: "abcd",
      _csrf: csrfToken,
    });
    console.log(res)
    expect(res.statusCode).toBe(302);
  })
  test('Creating a session as Player', async () => {
    const agent = request.agent(server)
    await login(agent, 'srinivas@gmail.com', 'abcd')
    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);
    const url=`/sportsession/Rugby`
    const res = await agent.get(url)
    const csrfToken = extractCsrfToken(res)
    const date_today = new Date();
    const response = await agent.post('/sportsession').send({
        name: 'Rugby',
        date: date_today,
        address: 'Parade Ground',
        players: ["1","2","4"],//id of players since there maybe multiple people with same name
        count: 4,
        cancelled: false,
       _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302) 
  })
  test("Sign out as Player", async () => {
    let res = await agent.get('/home')
    expect(res.statusCode).toBe(200)
    res = await agent.get('/signout')
    expect(res.statusCode).toBe(302)
    res = await agent.get('/home')
    expect(res.statusCode).toBe(302)
  })
});

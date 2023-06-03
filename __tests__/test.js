/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

let server, agent;

const { Sport, Session } = require("../models");

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
    server = app.listen(process.env.PORT || 6000, () => {});
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

  test("Sign Up as Admin 1", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Vineetha",
      lastName: "Reddy",
      email: "vineetha@gmail.com",
      role: "Admin",
      password: "vineetha123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Sign Up as Admin 2", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Sandhya",
      lastName: "Rani",
      email: "sandhya@gmail.com",
      role: "Admin",
      password: "sandhya123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Login as Admin", async () => {
    // without login function
    let res = await agent.get("/login");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: "vineetha@gmail.com",
      password: "vineetha123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Creating a sport as Admin", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");
    const res = await agent.get("/sport");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/sport").send({
      sport_name: "Rugby",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/sport_main/1");
  });
  test("Main Sport page endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");

    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);
    expect(res1.text).toContain("Rugby");
  });
  test("View previous sessions endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");

    const res1 = await agent.get("/previoussession/1");
    expect(res1.statusCode).toBe(200);
  });
  test("Editing a sport as Admin", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");
    const res = await agent.get("/editsport/Rugby/1");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/editsport/Rugby").send({
      sport_name: "Badminton",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/sport_main/1");

    const updatedSport = await Sport.getSportById(1);
    expect(updatedSport.sport_name).toBe("Badminton");
  });
  test("Other Admin can't edit sport", async () => {
    const agent = request.agent(server);
    await login(agent, "sandhya@gmail.com", "sandhya123");
    const res = await agent.get("/editsport/Badminton/1");
    // does not render the edit sport form
    expect(res.statusCode).toBe(401);
  });
  test("Deleting a sport as Admin", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");
    //crating a new sport
    const res = await agent.get("/sport");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/sport").send({
      sport_name: "Cricket",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);

    //deleting Cricket
    const res1 = await agent.get("/sport");
    expect(res.statusCode).toBe(200);
    const csrfToken1 = extractCsrfToken(res1);

    const res2 = await agent.get("/deletesport/2");
    expect(res2.statusCode).toBe(302);
    expect(res2.headers.location).toBe("/home");

    const updatedSport = await Sport.getSportById(2);
    expect(updatedSport).toBe(null);
  });
  test("Other Admin can't delete sport", async () => {
    const agent = request.agent(server);
    await login(agent, "sandhya@gmail.com", "sandhya123");
    const res = await agent.get("/deletesport/1");
    expect(res.statusCode).toBe(401);
  });
  test("Viewing reports", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");
    const res = await agent.get("/report");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/report").send({
      startDate: "2023-04-02T10:07:58.455Z",
      endDate: "2023-05-02T10:07:58.455Z",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      "/viewreport/2023-04-02T10:07:58.455Z/2023-05-02T10:07:58.455Z"
    );

    const res2 = await agent.get(
      "/viewreport/2023-04-02T10:07:58.455Z/2023-05-02T10:07:58.455Z"
    );
    expect(res2.statusCode).toBe(200);
  });
  test("Change password as Admin", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "vineetha123");
    const res = await agent.get("/profile");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/profile").send({
      oldpassword: "vineetha123",
      newpassword: "password123",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/home");
  });
  test("Creating a session as Admin", async () => {
    const agent = request.agent(server);
    await login(agent, "vineetha@gmail.com", "password123");
    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);
    const url = `/sportsession/Badminton/1`;
    const res = await agent.get(url);
    const csrfToken = extractCsrfToken(res);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const response = await agent.post("/sportsession").send({
      name: "Badminton",
      date: tomorrow,
      address: "Parade Ground",
      players: [1, 5, 4], //id of players since there maybe multiple people with same name
      count: 4,
      cancelled: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/session_main/1/0");
  });
  test("Sign out as Admin", async () => {
    let res = await agent.get("/home");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/home");
    expect(res.statusCode).toBe(302);
  });
  test("Sign Up as Player 1", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Srinivas",
      lastName: "Reddy",
      email: "srinivas@gmail.com",
      role: "Player",
      password: "srinivas123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Sign Up as Player 2", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Nitish",
      lastName: "Reddy",
      email: "nitish@gmail.com",
      role: "Player",
      password: "nitish123",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Login as Player", async () => {
    let res = await agent.get("/login");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/session").send({
      email: "srinivas@gmail.com",
      password: "srinivas123",
      _csrf: csrfToken,
    });
    console.log(res);
    expect(res.statusCode).toBe(302);
  });
  test("Change password as Player", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "srinivas123");
    const res = await agent.get("/profile");
    expect(res.statusCode).toBe(200);
    const csrfToken = extractCsrfToken(res);

    const response = await agent.post("/profile").send({
      oldpassword: "srinivas123",
      newpassword: "password123",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/home");
  });
  test("Player can't create sport", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");
    const res = await agent.get("/sport");
    expect(res.statusCode).toBe(401);
  });
  test("Player can't edit sport", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");
    const res = await agent.get("/editsport/Badminton/1");
    expect(res.statusCode).toBe(401);
  });
  test("Player can't delete sport", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");
    const res = await agent.get("/deletesport/1");
    expect(res.statusCode).toBe(401);
  });
  test("Creating a session as Player", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");
    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);
    const url = `/sportsession/Badminton/1`;
    const res = await agent.get(url);
    const csrfToken = extractCsrfToken(res);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const response = await agent.post("/sportsession").send({
      name: "Badminton",
      date: tomorrow,
      address: "LB Stadium",
      players: [1, 2, 4], //id of players since there maybe multiple people with same name
      count: 4,
      cancelled: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/session_main/2/0");
  });
  test("Removing players from a session", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");

    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);

    const updatedSession1 = await Session.getSessionById(2); // 2 is session id
    expect(updatedSession1.players).toContain(4); // 4 is user id

    const response = await agent.get("/removeplayer/4/2");
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/session_main/2/0");

    const updatedSession2 = await Session.getSessionById(2);
    expect(updatedSession2.players).not.toContain(4);
  });
  test("Join a session", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");

    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);

    const updatedSession1 = await Session.getSessionById(1); // 1 is session id
    expect(updatedSession1.players).not.toContain(3); // 3 is user id

    const response = await agent.get("/joinsession/1");
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/session_main/1/0");

    const updatedSession2 = await Session.getSessionById(1); // 1 is session id
    expect(updatedSession2.players).toContain(3); // 3 is user id
  });
  test("Leave a session", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");

    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);

    const updatedSession1 = await Session.getSessionById(1); // 1 is session id
    expect(updatedSession1.players).toContain(3); // 3 is user id

    const response = await agent.get("/leavesession/1");
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/session_main/1/0");

    const updatedSession2 = await Session.getSessionById(1); // 1 is session id
    expect(updatedSession2.players).not.toContain(3); // 3 is user id
  });
  test("Editing a session", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");

    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);

    const url = `/editsession/2/1/Badminton`;
    const res = await agent.get(url);
    const csrfToken = extractCsrfToken(res);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const response = await agent.post("/editsession/2").send({
      name: "Badminton",
      date: tomorrow,
      address: "Uppal Stadium",
      players: [1, 2, 3, 4],
      count: 7,
      cancelled: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/session_main/2/0");

    const updatedSession = await Session.getSessionById(2); // 2 is session id
    expect(updatedSession.count).toBe(7);
    expect(updatedSession.address).toBe("Uppal Stadium");
  });
  test("Cancelling a session", async () => {
    const agent = request.agent(server);
    await login(agent, "srinivas@gmail.com", "password123");

    const res1 = await agent.get("/sport_main/1");
    expect(res1.statusCode).toBe(200);

    const response = await agent.get("/cancelsession/2/1/Badminton");
    const csrfToken = extractCsrfToken(response);

    const response2 = await agent.post("/cancelsession/2/1").send({
      reason: "Bad Weather",
      _csrf: csrfToken,
    });

    expect(response2.statusCode).toBe(302);
    expect(response2.headers.location).toBe("/sport_main/1");
    const updatedSession = await Session.getSessionById(2);
    expect(updatedSession.reason).toBe("Bad Weather");
  });
  test("Other user can't edit session", async () => {
    const agent = request.agent(server);
    await login(agent, "nitish@gmail.com", "nitish123");
    const res = await agent.get("/editsession/2/1/Badminton");
    expect(res.statusCode).toBe(401);
  });
  test("Other user can't cancel session", async () => {
    const agent = request.agent(server);
    await login(agent, "nitish@gmail.com", "nitish123");
    const res = await agent.get("/cancelsession/2/1/Badminton");
    expect(res.statusCode).toBe(401);
  });

  test("Sign out as Player", async () => {
    let res = await agent.get("/home");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/home");
    expect(res.statusCode).toBe(302);
  });
});

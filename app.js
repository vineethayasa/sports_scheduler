/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const { request, response } = require("express");
const express = require("express");
const app = express();
const csrf = require("tiny-csrf");

const { User, Sport, Session } = require("./models");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const flash = require("connect-flash");

app.use(express.urlencoded({ extended: false }));
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(flash());
const user = require("./models/user");
const sport = require("./models/sport");

app.use(bodyParser.json());
app.use(cookieParser("ssh!!!! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "this is my secret-258963147536214",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      password: "password",
    },
    (username, password, done) => {
      console.log(User);
      console.log("check here");
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(null, false, { message: "Invalid user credentials" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  response.render("index", { csrfToken: request.csrfToken() });
});

app.get("/signup", (request, response) => {
  response.render("signup", { csrfToken: request.csrfToken() });
});
app.get("/login", (request, response) => {
  response.render("login", { csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/profile",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedinUser = request.user.id;
    const currentuser = await User.getUser(loggedinUser);
    response.render("profile", {
      currentuser,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/profile",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (!request.body.oldpassword || !request.body.newpassword) {
      request.flash("error", "Password cannot be empty");
      return response.redirect("/profile");
    }
    const hashedPwd = await bcrypt.hash(request.body.newpassword, saltRounds);
    if (
      !(await bcrypt.compare(request.body.oldpassword, request.user.password))
    ) {
      request.flash("error", "Enter correct old password");
      return response.redirect("/profile");
    }
    if (await bcrypt.compare(request.body.newpassword, request.user.password)) {
      request.flash("error", "Password cannot be same");
      return response.redirect("/profile");
    }
    try {
      await User.changePassword(request.user.id, hashedPwd);
      response.redirect("/home");
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect("/profile");
    }
  }
);

app.get(
  "/home",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedinUser = request.user.id;
    const currentuser = await User.getUser(loggedinUser);
    const sportsnames = await Sport.getSports();
    response.render("home", {
      currentuser,
      sportsnames,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (request, response) => {
    console.log(request.user);
    response.redirect("/home");
  }
);

app.post("/users", async (request, response) => {
  if (!request.body.firstName) {
    request.flash("error", "First Name cannot be empty");
    return response.redirect("/signup");
  }
  if (!request.body.email) {
    request.flash("error", "Email cannot be empty");
    return response.redirect("/signup");
  }

  if (!request.body.password) {
    request.flash("error", "Password cannot be empty");
    return response.redirect("/signup");
  }
  if (!request.body.role) {
    request.flash("error", "Role cannot be empty");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.addUser({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      role: request.body.role,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect("/");
      }
      response.redirect("/home");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", error.errors[0].message);
    response.redirect("/signup");
  }
});

app.get(
  "/sport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("new_sport", { csrfToken: request.csrfToken() });
  }
);
app.get(
  "/session_main/:session_id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const session_id = request.params.session_id;
    const session_details = await Session.getSessionById(session_id);
    console.log(session_details);
    const userid = request.user.id;
    const session_name = session_details.name;
    const session_date = session_details.date.toLocaleDateString();
    const session_time = session_details.date.toLocaleTimeString();
    const session_address = session_details.address;
    const session_players_id = session_details.players;
    const session_creator = session_details.userId;

    const session_players = await Promise.all(
      session_players_id.map(async (id) => await User.getUser(id))
    );
    //console.log(session_players)

    response.render("session_main", {
      userid,
      session_id,
      session_name,
      session_date,
      session_time,
      session_address,
      session_players,
      session_creator,
      csrfToken: request.csrfToken(),
    });
  }
);
app.get(
  "/sportsession/:sport_name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const data = await User.getAllUsers();
    const current_sport_name = request.params.sport_name;
    response.render("sportsessions", {
      data,
      current_sport_name,
      csrfToken: request.csrfToken(),
    });
  }
);
app.get(
  "/sport_main/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log(request.params.id);
    const current_sport = await Sport.getSportById(request.params.id);
    console.log(current_sport.sport_name);
    const sessionDetails = await Session.getSessions();
    const userid = request.user.id;
    response.render("sport_main", {
      current_sport,
      sessionDetails,
      userid,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (!request.body.sport_name) {
      request.flash("error", "Sport name cannot be empty");
      return response.redirect("/sport");
    }
    try {
      const sport = await Sport.addSport({
        sport_name: request.body.sport_name,
        userId: request.user.id,
      });
      console.log(sport.sport_name);
      console.log(sport);
      const url = `/sport_main/${sport.id}`;
      response.redirect(url);
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect("/sport");
    }
  }
);
//get edit sport
app.get(
  "/editsport/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport_name = request.params.name;
    response.render("editsport", {
      sport_name,
      csrfToken: request.csrfToken(),
    });
  }
);

//post edit sport
app.post(
  "/editsport/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log(request.params.name);

    if (!request.body.sport_name) {
      request.flash("error", "Sport name cannot be empty");
      return response.redirect(`/editsport/${request.params.name}`);
    }
    if (request.body.sport_name === request.params.name) {
      request.flash("error", "Sport name cannot be same");
      return response.redirect(`/editsport/${request.params.name}`);
    }
    try {
      const sport = await Sport.getSportByName(request.params.name);
      await Session.renameSportinSession(sport.id, request.body.sport_name);
      await Sport.renameSport(sport.id, request.body.sport_name);
      const url = `/sport_main/${sport.id}`;
      response.redirect(url);
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect(`/editsport/${request.params.name}`);
    }
  }
);

app.post(
  "/sportsession",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sport.getSportByName(request.body.name);
    const somename = request.body.name;
    const url = `/sportsession/${somename}`;
    if (!request.body.date) {
      request.flash("error", "Date cannot be empty");
      return response.redirect(url);
    }
    if (!request.body.address) {
      request.flash("error", "Address cannot be empty");
      return response.redirect(url);
    }
    console.log(request.body.players);

    if (!request.body.players || request.body.players.length < 2) {
      request.flash("error", " No. of players should be atleast 2");
      return response.redirect(url);
    }
    if (!request.body.count) {
      request.flash("error", "Enter 0 if no extra players needed");
      return response.redirect(url);
    }
    try {
      const stringplayers = request.body.players;
      const intplayers = stringplayers.map(Number);
      console.log(intplayers);
      const session = await Session.addSession({
        name: request.body.name,
        date: request.body.date,
        address: request.body.address,
        players: request.body.players,
        count: request.body.count,
        cancelled: false,
        sportId: sport.id,
        userId: request.user.id,
      });
      console.log(url);
      console.log(session);

      const someid = session.id;
      const url2 = `/session_main/${someid}`;
      response.redirect(url2);
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect(url);
    }
  }
);

// delete sport
app.get(
  "/deletesport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await User.removeSport(request.params.id);
      await Session.removeSessionbySport(request.params.id);
      await Sport.remove(request.params.id);
      response.redirect("/home");
    } catch (error) {
      console.log(error);
    }
  }
);

// join session
app.get(
  "/joinsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const session = await Session.getSessionById(request.params.id);
      if (session.date < new Date()) {
        request.flash("error", `Session completed`);
        response.redirect(`/session_main/${request.params.id}`);
      } else if (session.cancelled) {
        request.flash("error", `Session cancelled`);
        response.redirect(`/session_main/${request.params.id}`);
      } else if (session.players.includes(request.user.id)) {
        request.flash("error", `Already joined the Session`);
        response.redirect(`/session_main/${request.params.id}`);
      } else if (session.count < 1) {
        request.flash("error", `All slots are booked`);
        response.redirect(`/session_main/${request.params.id}`);
      } else {
        await Session.joinSession(request.user.id, request.params.id);
        response.redirect(`/session_main/${request.params.id}`);
      }
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect(`/session_main/${request.params.id}`);
    }
  }
);

//leave session
app.get(
  "/leavesession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const session = await Session.getSessionById(request.params.id);
      if (session.date < new Date()) {
        request.flash("error", `Session completed`);
        response.redirect(`/session_main/${request.params.id}`);
      } else if (session.cancelled) {
        request.flash("error", `Session cancelled`);
        response.redirect(`/session_main/${request.params.id}`);
      } else if (!session.players.includes(request.user.id)) {
        request.flash("error", `Did not join session`);
        response.redirect(`/session_main/${request.params.id}`);
      } else {
        await Session.leaveSession(request.user.id, request.params.id);
        response.redirect(`/session_main/${request.params.id}`);
      }
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect(`/session_main/${request.params.id}`);
    }
  }
);

app.get(
  "/removeplayer/:playerid/:sessionid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const session = await Session.getSessionById(request.params.sessionid);
      await Session.leaveSession(
        request.params.playerid,
        request.params.sessionid
      );
      response.redirect(`/session_main/${request.params.sessionid}`);
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      response.redirect(`/session_main/${request.params.sessionid}`);
    }
  }
);

app.get("/allsessions", async (request, response) => {
  try {
    const sessions = await Session.findAll();
    return response.send(sessions);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/allusers", async (request, response) => {
  try {
    const users = await User.findAll();
    return response.send(users);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/allsports", async (request, response) => {
  try {
    const sports = await Sport.findAll();
    return response.send(sports);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;

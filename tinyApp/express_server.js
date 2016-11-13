"use strict";

const bodyParser = require("body-parser");
const randomGenerator = require("./randomGenerator");
const express = require("express");
const app = express();
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

// Why use this process.env here ?
const PORT = process.env.PORT || 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public')); //somethign is wrong here
/*CookieParser helps us read sessions, not create them
which is part of express*/
// app.use(cookieParser());
app.use(cookieSession({ name: 'session',
  keys: ['key1', 'key2']}));


const urlDatabase = {

  //shortURL: {id: user_id, longURL: longurl}
};

const users = {};


app.get("/", (req, res) => {
  const templateVars = { urls: urlDatabase,
    // username: req.session.username,
    user: req.session.user_id,
    userList: users };
  if (!users.hasOwnProperty(templateVars.user)) {
    res.redirect("/login")
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  /*Here we could import lodash to turn urls into an array to simplify the forEach on the page.
  However, urlDatabase must be an object so we can get the keys easily*/
  const templateVars = { urls: urlDatabase,
    // username: req.session.username,
    user: req.session.user_id,
    userList: users };
  if (!users.hasOwnProperty(templateVars.user)) {
    res.status(401).send("Error 401, You must be logged in to access this page. \n <a href = /login>Click here</a> to get to the login page.");
  } else {
    res.status(200);
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase,
    // username: req.session.username,
    user: req.session.user_id,
    userList: users };
  // console.log("this is the user:", users[req.sessions["user_id"]]);

  if (users.hasOwnProperty(req.session.user_id)) {
    res.status(200);
    res.render("urls_new", templateVars);
  } else {
    res.status(400).send("Error 401, You must be logged in to access this page. \n <a href = /login>Click here</a> to get to the login page.");
  };
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {shortURL: req.params.id,
    user: req.session.user_id,
    userList: users };
  if (!urlDatabase.hasOwnProperty(templateVars.shortURL)) {
    res.status(404).send("Error 404. The page you are trying to access does not exist! Get back to <a href = /> Home Page</a>.");
  }
  templateVars.longURL = urlDatabase[req.params.id]["longURL"];
  if (!users.hasOwnProperty(templateVars.user)) {
    res.status(401).send("Error 401, You must be logged in to access this page. \n <a href = /login>Click here</a> to get to the login page.");
  } else if (templateVars.user !== urlDatabase[templateVars.shortURL]["id"]) {
    res.status(403).send("Error 403. You are not the owner of this URL! <a href = /login>Click here</a> to log in as the right user");
  } else {
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
   if (!urlDatabase.hasOwnProperty(shortURL)) {
    res.status(404).send("Error 404. This short url does not exist! Get back to <a href = /> Home Page</a>.");
  } else {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL)
  };
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase,
    // username: req.session.username,
    user: req.session.user_id,
    userList: users };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase,
    // username: req.session.username,
    user: req.session.user_id,
    userList: users };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = randomGenerator.randomUrl()
  // let longURL = `/urls/${shortURL}`;
  /*On the website, redirecting to the longURL above doesn't make any sense, so I'll change the endpoint for now.*/

  if (req.body.longURL[0] !== "h") {
    res.status(400).send("Error 400. The format of your URL is not valid, please make sure to add http:// at the begining")
  } else if (!req.session.user_id) {
    res.status(400).send("Error 400. Sorry, we can't recognize you, did you reset your cookies?")
  } else {
      urlDatabase[shortURL] = {id: req.session.user_id, longURL: req.body.longURL}; // add object {id: user_id, longURL: longUrl}
    // res.redirect(longURL);
    res.redirect("/urls")
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  // res.redirect("/")
  const id = Object.keys(users).find((id) => users[id].email === email );
  const user = users[id];

  if (!id) {
    res.status(403).send(`Error 403, email ${email} does not exists.`);
  } else if (!password) {
    res.status(403).send(`Error 403, You did not enter any password!`);
  } else if (!bcrypt.compareSync(password, user.hashed_password)) {
    res.status(403).send(`Error 403, Wrong password.`);
  } else {
    console.log('this is the id:', id)
    req.session.user_id = id;
    console.log("this is the cookie:", req.session.user_id)
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie("user_id"); // this no longer works
  // req.logOut();
  res.redirect('/');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashed_password = bcrypt.hashSync(password, 10);
  if (Object.keys(users).find((id) => users[id].email === email)) {
    res.status(400).send(`Error 400. Email ${email} already`)
  } else {
    const id = randomGenerator.randomUrl();
    users[id] = { id, email, hashed_password };
    // req.session("user_id", users[id]["id"]);
    res.redirect("/")
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    // username: req.session["username"],
    user: req.session.user_id,
    userList: users };
  const {shortURL, longURL} = req.params;
  urlDatabase[shortURL]["longURL"] = longURL;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
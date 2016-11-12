"use strict";

const bodyParser = require("body-parser");
const randomGenerator = require("./randomGenerator");
const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');

// Why use this process.env here ?
const PORT = process.env.PORT || 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
/*CookieParser helps us read cookies, not create them
which is part of express*/
app.use(cookieParser());


const urlDatabase = {};

const users = {};


app.get("/", (req, res) => {
  res.redirect("/urls")
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/urls", (req, res) => {
  /*Here we could import lodash to turn urls into an array to simplify the forEach on the page.
  However, urlDatabase must be an object so we can get the keys easily*/
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"],
    user: req.cookies["user_id"],
    userList: users };
  if (!users.hasOwnProperty(templateVars.user)) { //not suffient, if a cookie remained, this will return false, gotta check against database
    res.redirect("/login")
  } else {
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"],
    user: req.cookies["user_id"],
    userList: users };
  // console.log("this is the user:", users[req.cookies["user_id"]]);

  if (users.hasOwnProperty(req.cookies["user_id"])) {
    res.render("urls_new", templateVars)
  } else {
    res.status(400).send("Sorry your are not logged in, please log in to add your URLs!")
  };
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
    user: req.cookies["user_id"],
    userList: users };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  /*Only redirect if the specified url exists, else, just return an error message. Msg can be modified.*/
  if (!urlDatabase.hasOwnProperty(shortURL)) {
    res.status(400).send(`Your url have been invalid must have been invalid!...
    <br> Make sure you added http:// at the begining`);
  } else {
    res.redirect(longURL)
  };
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"],
    user: req.cookies["user_id"],
    userList: users };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"],
    user: req.cookies["user_id"],
    userList: users };
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = randomGenerator.randomUrl()
  // let longURL = `/urls/${shortURL}`;
  /*On the website, redirecting to the longURL above doesn't make any sense, so I'll change the endpoint for now.*/

  if (req.body.longURL[0] !== "h") {
    res.end("The format of your URL is not valid, please make sure to add http:// at the begining")
  } else if (!req.cookies["user_id"]) {
    res.status(400).send("Sorry, we can't recognize you, did you reset your cookies?")
  } else {
      urlDatabase[shortURL] = {id: req.cookies["user_id"], longURL: req.body.longURL}; // add object {id: user_id, longURL: longUrl}
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
  const email = req.body.email;
  const password = req.body.password;
  // res.cookie("username", req.body.username);
  // res.redirect("/")
  const id = Object.keys(users).find((id) => users[id].email === email );
  const user = users[id];
  if (!id) {
    res.status(403).send(`Error 403, email ${email} does not exists.`);
  } else if (!password) {
    res.status(403).send(`Error 403, You did not enter any password!`);
  } else if (user.password !== password) {
    res.status(403).send(`Error 403, Wrong password.`);
  } else {
    // must add code to check for empty password
    res.cookie("user_id", id);
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/');
});

app.post("/register", (req, res) => {
  // const { email, password } = req.body;
  const email = req.body.email;
  const password = req.body.password;
  if (Object.keys(users).find((id) => users[id].email === email)) {
    res.end(`<html><body> Error 400, Email ${email} already exists </body></html>\n`)
  } else {
    const id = randomGenerator.randomUrl();
    users[id] = { id, email, password };
    // res.cookie("user_id", users[id]["id"]);
    res.redirect("/")
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
    user: req.cookies["user_id"],
    userList: users };
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL]["longURL"] = longURL;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
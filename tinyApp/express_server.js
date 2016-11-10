"use strict";

const bodyParser = require("body-parser");
const urlGenerator = require("./randomGenerator");
const express = require("express");
const app = express();
// Why use this process.env here ?
const PORT = process.env.PORT || 8080; // default port 8080

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'))

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "test": "www.test.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  /*Only redirect if the specified url exists, else, just return an error message. Msg can be modified.*/
  if (!urlDatabase.hasOwnProperty(shortURL)){
    res.end(`<html><body>Aha, your url have been invalid must have been invalid!...
      <br> Make sure you added http:// at the begining when you uploaded your url</body></html>\n`);
  } else {res.redirect(longURL)
  };
});

app.post("/urls", (req, res) => {
  let shortURL = urlGenerator.randomUrl()
  // let longURL = `/urls/${shortURL}`;
  /*On the website, redirecting to the longURL above doesn't make any sense, so I'll change the endpoint for now.*/
  if (req.body.longURL[0] !== "h"){
    res.end("The format of your URL is not valid, please make sure to add http:// at the begining")
  } else {
    urlDatabase[shortURL] = req.body.longURL;
    // res.redirect(longURL);
    res.redirect("/urls")
  }
});

  app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  delete urlDatabase[shortURL];
  res.redirect("/urls")
});

  app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  console.log(req.body);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
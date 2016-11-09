"use strict";


const express = require("express");
const app = express();
// Why use this process.env here ?
const PORT = process.env.PORT || 8080; // default port 8080

app.set('view engine', 'ejs');


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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
  /*what does this exactly do?? Guess: upon receiving GET request with specified endpoint, it will
  insert templateVars in urls_index wherver specify. Sortof like an import. Understanding to be refined*/

});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

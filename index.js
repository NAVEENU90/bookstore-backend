// import .env file
require("dotenv").config(); //load env file

// import express lib

const express = require("express");
// import cors
const cors = require("cors");
const path = require("path");

// import route
const route = require("./routes");
const appMiddleware = require("./middleware/appMiddleware.js");

// import db connection file
require("./databaseConnection");

// Create the server - express()
const bookstoreServer = express();

// server using cors
bookstoreServer.use(cors());
bookstoreServer.use(express.json()); //parse json-middleware

// bookstoreServer.use(appMiddleware)
bookstoreServer.use(route);
bookstoreServer.use("/upload", express.static(path.join(__dirname, "uploads")));
// Create Port
const PORT = process.env.PORT || 4000;

bookstoreServer.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});

bookstoreServer.get("/", (req, res) => {
  res.status(200).send(`<h1>Server Started!!</h1>`);
});

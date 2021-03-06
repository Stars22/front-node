const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth')
require("dotenv").config();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'images');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/gif" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({ storage, fileFilter });


const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images"))); // application/json
app.use(upload.single('image'));
app.use((req, res, next) => {
  console.log(req.isAuth);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if(req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(auth);
app.use('/graphql', graphqlHttp({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(err) {
    if(!err.originalError) {
      return err;
    }
    const { data, statusCode = 500 } = err.originalError;
    const message = err.message || 'An error occured';
    return {data, statusCode, message};
  }
}))

app.use((err, req, res, next) => {
  console.log(err);
  const status = err.statusCode || 500;
  const data = err.data;
  const message = err.message;
  res.status(status).json({ message, data });
});

mongoose.connect(process.env.API_URL, { useNewUrlParser: true }, err => {
  app.listen(8080);
});

const express = require("express");
PORT = 8080;

const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const morgan = require('morgan')
const ejs = require('ejs');
const bodyParser = require('body-parser');
const Config = require('./models/config');
const configRoutes = require('./routes/configRoutes');

// express app
const app = express();

// ======================== DB Connection =========================== //

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;
const cluster = process.env.MONGODB_CLUSTER;
const dbname = process.env.MONGODB_DB;

// connect to mongodb & listen for requests
const dbURI = `mongodb+srv://${username}:${password}@${cluster}.m1frkug.mongodb.net/${dbname}?retryWrites=true&w=majority`;

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => app.listen(PORT), console.log('🌎 Listening to port', PORT,'and MongoDB connected'))
  .catch(err => console.log(err));

// ================================================================== //

// register view engine
app.set('view engine', 'ejs');
app.set('views', './frontend/views');

// middleware & static files
app.use(express.json());
app.use(express.static('frontend'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.locals.path = req.path;
  next();
});


// routes
app.get('/', (req, res) => {
  res.redirect('/configs');
});

app.use('/configs', configRoutes);

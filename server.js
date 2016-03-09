"use strict";

const express = require('express'),
    path = require('path'),
    config = require('./node/config/config.js'),
    mongoose = require('mongoose').connect(config.dbURL),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    jwt = require('jsonwebtoken'),
    bodyParser = require('body-parser'),
    bcrypt = require('bcryptjs'),
    nodemailer = require('nodemailer'),
    sendGridTransport = require('nodemailer-sendgrid-transport'),
    generatePassword = require('password-generator');

if (config.environment === 'development') {
  var util = require('util');
}

const app = express();
const router = express.Router();

app.set('port', process.env.PORT || 5000);
app.set('host', config.host);
app.set('userSecret', config.jwtSecret);
app.set('appFrontFacingName', config.appFrontFacingName);
app.set('domain', config.domain);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'node/views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'www')));

const UsersModel = require('./node/models/users.js')(mongoose);
const mailer = require('./node/email/transport.js')(nodemailer, sendGridTransport, config);
require('./node/auth/passportAuth.js')(passport, LocalStrategy, config, UsersModel, bcrypt);
require('./node/routes/routes.js')(app, router, passport, jwt, UsersModel, bcrypt, mailer, generatePassword);

const server = require('http').createServer(app);

server.listen(app.get('port'), function(){
  console.log(`Ionic Project Running on port: ${app.get('port')}`);
  console.log(`host: ${config.host}`);
});
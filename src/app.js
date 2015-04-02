/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, process, __dirname, GLOBAL*/

/**
 * Module dependencies.
 */

var express = require('express'),
    exphbs  = require('express-handlebars'),

    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    errorHandler = require('errorhandler'),

    passport = require('passport'),
    flash = require('connect-flash'),
    path = require('path'),
    tmxLoader = require('./tmx-loader'),
    routes = require('./routes'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    chat = require('./chat'),
    _ = require('underscore')._,
    browserify = require('browserify-middleware'),
    Promise = require('bluebird'),
    RedisStore = require('connect-redis')(session),
    redisClient = require('./config/redis-client'),
    sessionStore = new RedisStore({client: redisClient}),
    passportSocketIo = require('passport.socketio'),
    openSockets = require('./state/open-sockets');


require('./config/passport')(passport);
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/screens');
app.set('view engine', 'handlebars');
app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({
    key: 'express.sid',
    secret: 'arerhciusinieadqe-5124S',
    store: sessionStore
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: 'arerhciusinieadqe-5124S',
    store: sessionStore,
    passport: passport
}));
chat.init(io);
openSockets.init(io);
app.engine('handlebars', exphbs({
    layoutsDir: 'screens/_common/layouts',
    defaultLayout: 'plain',
    partialsDir: 'screens/_common/partials'
}));


var env = process.env.NODE_ENV || 'development';
if ('production' === env) {
    app.use(function(err, req, res, next) {
        'use strict';
        chat.error('Error');
        res.send(500, 'Something broke!');
    });
}

if ('development' === env) {
    app.use(errorHandler());
}

Promise.promisifyAll(require("redis"));

//js bundles
app.get('/ship-builder/bundle.js', browserify(__dirname + '/screens/ship-builder/client-js/entry.js'));
app.get('/battle/bundle.js', browserify(__dirname + '/screens/battle/client-js/entry.js'));
app.get('/ship-frame/bundle.js', browserify(__dirname + '/screens/ship-frame/client-js/entry.js'));
routes.register(app);

console.log('Testing redis connection...');
redisClient.getAsync('asdf').then(function() {
    'use strict';
    console.log('Loading maps...');
    tmxLoader.load(function() {
        server.listen(app.get('port'), function() {
            console.log('Express server listening on port ' + app.get('port'));
        });
    });
}).catch(function(e) {
    'use strict';
    throw e;
});




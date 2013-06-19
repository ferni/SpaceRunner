/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, process, __dirname*/

/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    ship = require('./routes/ship'),
    battles = require('./routes/battles'),
    lobby = require('./routes/lobby'),
    http = require('http'),
    path = require('path'),
    shared = require('./public/js/shared'),
    app = express(),
    //TODO: change for connect-redis store
    store  = new express.session.MemoryStore;

    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'asdfqwerasdfaq34%RT·W4tSDFg345t3qS$T·' +
            '345·FSdg32$1@E2345r·Tefg4Drsertq4tq4ohelfg' +
            'xvdsrgERTWFGDFG-ete$_w4tqouyhjkhdsfghdfgkjh',
        store: store }));

app.configure(function() {
    'use strict';
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));

});

app.configure('development', function() {
    'use strict';
     app.use(express.errorHandler());
});


//app.get('/', routes.index);

app.post('/save', ship.save);
app.post('/load', ship.load);
app.get('/lobby/get', lobby.get);

app.post('/battles/create', battles.create);
app.post('/battles/join', battles.join);

//globals
GLOBAL.battles = []; //filled with model.Battle
GLOBAL.currentPlayers = []; //filled with model.Player

http.createServer(app).listen(app.get('port'), function() {
    'use strict';
    console.log('Express server listening on port ' + app.get('port'));

});


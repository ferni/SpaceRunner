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
    screens = require('./screens-server'),
    chat = require('./screens/_common/server-js/chat'),
    http = require('http'),
    path = require('path'),
    shipMaps = require('./screens/_common/server-js/ship-maps'),
    app = express(),
    _ = require('underscore')._,
    shipApi = require('./screens/ship-builder/json-api'),
    //TODO: change for connect-redis store
    store = new express.session.MemoryStore();
app.use(express.cookieParser());
app.use(express.session({
    secret: 'asdfqwerasdfaq34%RT·W4tSDFg345t3qS$T·' +
        '345·FSdg32$1@E2345r·Tefg4Drsertq4tq4ohelfg' +
        'xvdsrgERTWFGDFG-ete$_w4tqouyhjkhdsfghdfgkjh',
    store: store
}));
app.engine('handlebars', exphbs({
    layoutsDir: 'screens/_common/layouts',
    defaultLayout: 'plain',
    partialsDir: 'screens/_common/partials'
}));
app.configure(function() {
    'use strict';
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/screens');
    app.set('view engine', 'handlebars');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('production', function() {
    'use strict';
    //error handler
    app.use(function(err, req, res, next) {
        chat.error('Error');
        res.send(500, 'Something broke!');
    });
});

app.configure('development', function() {
    'use strict';
    app.use(express.errorHandler());
});


app.get('/', require('./screens/home/controller'));
app.get('/ship-builder', require('./screens/ship-builder/controller'));
app.get('/ship-list', require('./screens/ship-list/controller'));
app.get('/choose-type', require('./screens/choose-type/controller'));

_.each(shipApi, function(apiGroup, groupName) {
    'use strict';
    _.each(apiGroup, function(callback, methodName) {
        app.post('/' + groupName + '/' + methodName, callback);
    });
});

//globals
/**
 * filled with model.BattleSetUp.
 * @type {Array}
 */
GLOBAL.battleSetUps = [];
/**
 * filled with model.BattleServer.
 * @type {Array}
 */
GLOBAL.battles = [];

console.log('Loading maps...');
shipMaps.loadMaps(function(maps) {
    'use strict';
    GLOBAL.hullMaps = maps;
    http.createServer(app).listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port'));
    });
});



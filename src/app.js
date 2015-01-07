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
    chat = require('./chat'),
    players = require('./state/players'),
    http = require('http'),
    path = require('path'),
    tmxLoader = require('./tmx-loader'),
    routes = require('./routes'),
    app = express(),
    _ = require('underscore')._,
    browserify = require('browserify-middleware'),
    //TODO: change for connect-redis store
    store = new express.session.MemoryStore();
app.use(express.cookieParser());
app.use(express.session({
    secret: 'asdfqwerasdfaq34%RT·W4tSDFg345t3qS$T·' +
        '345·FSdg32$1@E2345r·Tefg4Drsertq4tq4ohelfg' +
        'xvdsrgERTWFGDFG-ete$_w4tqouyhjkhdsfghdfgkjh',
    store: store
}));
app.use(players.authenticate);
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

routes.register(app);

//js bundles
app.get('/ship-builder/bundle.js', browserify('./screens/ship-builder/client-js/entry.js'));
app.get('/battle/bundle.js', browserify('./screens/battle/client-js/entry.js'));
app.get('/ship-frame/bundle.js', browserify('./screens/ship-frame/client-js/entry.js'));

console.log('Loading maps...');
tmxLoader.load(function() {
    'use strict';
    http.createServer(app).listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port'));
    });
});



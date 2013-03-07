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
    http = require('http'),
    path = require('path'),

    app = express();

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
http.createServer(app).listen(app.get('port'), function() {
    'use strict';
  console.log('Express server listening on port ' + app.get('port'));
});

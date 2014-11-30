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
    routes = require('./routes'),
    ship = require('./routes/ship'),
    screens = require('./screens-server'),
    general = require('./routes/general'),
    chat = require('./screens/_common/server-js/chat'),
    chatRoutes = require('./routes/chat'),
    http = require('http'),
    path = require('path'),
    sh = require('./shared'),
    shipMaps = require('./screens/_common/server-js/ship-maps'),
    app = express(),

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

app.get('/battle', function (req, res) {
    'use strict';
    res.render('battle');
});

app.get('/ship-select', function (req, res) {
    'use strict';
    res.render('ship-select');
});

app.post('/save', ship.save);
app.post('/load', ship.load);
app.post('/ship/gethulls', ship.gethulls);

screens.configureRoutes(app);
//console.log(screens.getAll());

app.post('/general/init', general.init);
app.post('/general/ping', general.ping);
app.post('/general/sharedprops', general.sharedprops);

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


chat.init(app, chatRoutes);

console.log('Loading maps...');
shipMaps.loadMaps(function(maps) {
    'use strict';
    GLOBAL.hullMaps = maps;
    http.createServer(app).listen(app.get('port'), function() {
        console.log('Express server listening on port ' + app.get('port'));
    });
});



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
    battleSetUps = require('./routes/battle-set-up'),
    battle = require('./routes/battle'),
    lobby = require('./routes/lobby'),
    general = require('./routes/general'),
    chat =require('./chat'),
    chatRoutes = require('./routes/chat'),
    http = require('http'),
    path = require('path'),
    sh = require('./public/js/shared'),
    shipMaps = require('./ship-maps'),
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

app.configure('production', function(){
    //error handler
    app.use(function(err, req, res, next){
        chat.error('Error');
        res.send(500, 'Something broke!');
    });
});

app.configure('development', function() {
    'use strict';
     app.use(express.errorHandler());
});


//app.get('/', routes.index);

app.post('/save', ship.save);
app.post('/load', ship.load);
app.post('/ship/gethulls', ship.gethulls);

app.get('/lobby/get', lobby.get);

app.post('/battle-set-up/get', battleSetUps.get);
app.post('/battle-set-up/start', battleSetUps.start);
app.post('/battles/create', battleSetUps.create);
app.post('/battles/join', battleSetUps.join);

app.post('/battle/get', battle.get);

app.post('/general/ping', general.ping);
app.post('/general/sharedprops', general.sharedprops);
app.post('/general/disconnect', general.disconnect);

//globals
GLOBAL.battleSetUps = []; //filled with model.BattleSetUp
GLOBAL.battles = []; //filled with model.Battle
GLOBAL.currentPlayers = []; //filled with model.Player

chat.init(app, chatRoutes);

console.log('Loading maps...');
shipMaps.loadMaps(function(maps){
    'use strict';
    GLOBAL.hullMaps = maps;
    http.createServer(app).listen(app.get('port'), function() {
        'use strict';
        console.log('Express server listening on port ' + app.get('port'));
    });
});



/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var auth = require('../auth'),
    _ = require('underscore')._,
    routes = require('./routes');

routes.add('get', function(req, res, next) {
    var id = req.body.id,
        battle = _.find(battles, function(b){
            return b.id == id;
        });
    if(!battle) {
        next(new Error('Battle not found, id: ' + id));
        return;
    }

    if(!battle.isPlayerInIt(auth.getID(req))) {
        next(new Error('Player has no access to battle ' + id));
        return;
    }
    return res.json({
        id: battle.id
        //otherPlayerReady:
    });
});

routes.add('submitorders', function(req, res, next){
    var id = req.body.id, //the battle id
        playerID = auth.getID(req);

});

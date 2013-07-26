/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var auth = require('../auth'),
    _ = require('underscore')._,
    routes = require('./routes'),
    sh = require('../public/js/shared'),
    chat = require('../chat');

function getByID(battleID){
    var id = parseInt(battleID);
    return _.find(battles, function(b){
        return b.id === id;
    });
}

routes.add('get', function(req, res, next) {
    var id = req.body.id,
        battle = getByID(id);
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
        battle = getByID(id),
        orders = req.body.orders,
        playerID = auth.getID(req),
        i;
    if(!battle) {
        next(new Error('Battle '+ id +' not found'));
        return;
    }
    for (i = 0; i < orders.length; i++) {
        if(!sh.verifyOrder(orders[i], battle.ship, playerID)) {
            chat.log('ERROR: An order was invalid.');
            next(new Error('An order submitted is invalid'));
            return;
        }
    }
    //TODO: add players' orders to battle
    chat.log('SUCCESS: All orders submitted have been validated by the sever.');
    return res.json({ok: true});
});

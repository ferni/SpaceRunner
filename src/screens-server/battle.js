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
        battle = getByID(id),
        playerID = auth.getID(req),
        script = null;
    if(!battle) {
        next(new Error('Battle not found, id: ' + id));
        return;
    }

    if(!battle.isPlayerInIt(playerID)) {
        next(new Error('Player has no access to battle ' + id));
        return;
    }
    if (battle.playersReady) {
        script = battle.generateScript();
        //will send the data, remove orders from player
        battle.removeOrders(playerID);
    }

    return res.json({
        id: battle.id,
        script: script
    });
});

routes.add('submitorders', function(req, res, next){
    var id = req.body.id, //the battle id
        battle = getByID(id),
        orders = req.body.orders,
        playerID = auth.getID(req),
        i, verifiedOrdersCount = 0;
    if(!battle) {
        next(new Error('Battle '+ id +' not found'));
        return;
    }
    for (i = 0; i < orders.length; i++) {
        if(!sh.verifyOrder(orders[i], battle.ship, playerID)) {
            chat.log('ERROR: An order was invalid.');
            next(new Error('An order submitted is invalid'));
            return;
        }else{
            verifiedOrdersCount++;
        }
    }

    battle.addOrders(playerID, orders);

    chat.log('SUCCESS: All orders submitted have been validated by the' +
        ' server (' + verifiedOrdersCount +' orders).');
    return res.json({ok: true});
});

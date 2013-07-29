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

/**
 * Makes sure that the battle exists and that the
 * player making the request is in the battle.
 * @param req {Object} The request object.
 * @param next {} next function.
 * @param callback {} Passes: battle and playerID
 */
function authenticate(req, next, callback) {
    var id = req.body.id,
        battle = getByID(id),
        playerID = auth.getID(req);
    if (!battle) {
        next(new Error('Battle not found, id: ' + id));
        return;
    }
    if(!battle.isPlayerInIt(playerID)) {
        next(new Error('Player has no access to battle ' + id));
        return;
    }
    return callback(battle, playerID);
}

routes.add('get', function(req, res, next) {
    return authenticate(req, next, function(battle){
        return res.json({
            id: battle.id,
            scriptReady: battle.currentTurn.script !== null,
            currentTurnID: battle.currentTurn.id
        });
    });
});

routes.add('submitorders', function(req, res, next){
    var orders = req.body.orders,
        verifiedOrdersCount = 0;
    return authenticate(req, next, function(battle, playerID){
        var turn, unitID;
        if(!orders) {
            orders = {};
        }
        for (unitID in orders) {
            if (orders.hasOwnProperty(unitID)) {
                //for now each unit just has one order
                if(!sh.verifyOrder(orders[unitID], battle.ship, playerID)) {
                    chat.log('ERROR: An order was invalid.');
                    next(new Error('An order submitted is invalid'));
                    return;
                }else{
                    verifiedOrdersCount++;
                }
            }
        }

        turn = battle.currentTurn;
        turn.addOrders(playerID, orders);
        if(turn.playersSubmitted.length === battle.numberOfPlayers &&
            !turn.script) {
            //all orders have been submitted, generate the script
            turn.generateScript();
            //TODO: make the function updateShip... server side only
            //then send the updated ship to the clients
            sh.updateShipByScript(battle.ship, turn.script, 3000);
        }
        chat.log('SUCCESS: All orders submitted have been validated by the' +
            ' server (' + verifiedOrdersCount +' orders).');
        return res.json({ok: true});
    });
});


routes.add('getscript', function(req, res, next) {
    return authenticate(req, next, function(battle){
        return res.json({script: battle.currentTurn.script});
    });
});

routes.add('scriptreceived', function(req, res, next){
    return authenticate(req, next, function(battle, playerID){
        var nextTurnCreated = battle.registerScriptReceived(playerID);
        if(nextTurnCreated) {
            chat.log('All players received the script, created next turn.');
        }
        return res.json({ok: true});
    });
});

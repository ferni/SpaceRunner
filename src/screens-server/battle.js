/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, battles*/

var auth = require('../auth'),
    _ = require('underscore')._,
    routes = require('./routes'),
    sh = require('../public/js/shared'),
    chat = require('../chat');

function getByID(battleID) {
    'use strict';
    var id = parseInt(battleID, 10);
    return _.find(battles, function(b) {
        return b.id === id;
    });
}

/**
 * Makes sure that the battle exists and that the
 * player making the request is in the battle.
 * @param {Object} req The request object.
 * @param {Function} next next function.
 * @param {Function} callback Parameters: battle and playerID
 * @return {*}
 */
function authenticate(req, next, callback) {
    'use strict';
    var id = req.body.id,
        battle = getByID(id),
        playerID = auth.getID(req);
    if (!battle) {
        next(new Error('Battle not found, id: ' + id));
        return;
    }
    if (!battle.isPlayerInIt(playerID)) {
        next(new Error('Player has no access to battle ' + id));
        return;
    }
    return callback(battle, playerID);
}

routes.add('get', function(req, res, next) {
    'use strict';
    return authenticate(req, next, function(battle) {
        return res.json({
            id: battle.id,
            scriptReady: battle.currentTurn.script !== null,
            currentTurnID: battle.currentTurn.id
        });
    });
});

routes.add('getmodel', function(req, res, next) {
    'use strict';
    return authenticate(req, next, function(battle, playerID) {
        var battleJson = battle.toJson();
        if (battle.currentTurn) {
            battleJson.orders = battle.currentTurn.playersOrders[playerID];
        }
        return res.json(battleJson);
    });
});

routes.add('sendorders', function(req, res, next) {
    'use strict';
    var orders = req.body.orders,
        verifiedOrdersCount = 0;
    return authenticate(req, next, function(battle, playerID) {
        var turn;
        if (!orders) {
            orders = {};
        }
        _.each(orders, function(unitOrders) {
            _.each(unitOrders, function(order) {
                if (!sh.verifyOrder(order, battle.ship, playerID)) {
                    chat.log('ERROR: An order was invalid.');
                    next(new Error('An order submitted is invalid'));
                    return;
                }
                verifiedOrdersCount++;
            });
        });

        turn = battle.currentTurn;
        turn.addOrders(orders, playerID);
        //verifiedOrdersCount is available for logging, but it might tip the
        //other player with how many orders this player issued.
        chat.log('SUCCESS: The orders issued by ' +
            auth.playerByID(playerID).name +
            ' have been validated by the server');
        return res.json({ok: true});
    });
});

routes.add('ready', function(req, res, next) {
    'use strict';
    return authenticate(req, next, function(battle, playerID) {
        var turn = battle.currentTurn,
            winnerDeclared;
        if (turn.isPlayerReady(playerID)) {
            return res.json({wasReady: true});
        }
        turn.setPlayerReady(playerID);
        if (_.uniq(turn.playersSubmitted).length === battle.numberOfPlayers &&
                !turn.script) {
            //all orders have been submitted, generate the script
            battle.generateScript();
            winnerDeclared = _.find(turn.script.actions, function(a) {
                return a instanceof sh.actions.DeclareWinner;
            });
            if (winnerDeclared) {
                battle.winner = winnerDeclared.playerID;
            }
        }
        return res.json({wasReady: false});
    });
});


routes.add('getscript', function(req, res, next) {
    'use strict';
    return authenticate(req, next, function(battle) {
        return res.json({
            script: battle.currentTurn.script.toJson(),
            resultingShip: battle.ship.toJson()
        });
    });
});

routes.add('scriptreceived', function(req, res, next) {
    'use strict';
    return authenticate(req, next, function(battle, playerID) {
        var nextTurnCreated = battle.registerScriptReceived(playerID),
            index;
        if (nextTurnCreated) {
            if (battle.winner !== null) {
                index = _.indexOf(battles, battle);
                battles.splice(index, 1);
            } else {
                chat.log('All players received the script, created next turn.');
            }
        }
        return res.json({ok: true});
    });
});

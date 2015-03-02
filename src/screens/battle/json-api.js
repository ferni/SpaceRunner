/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/

var players = require('../../state/players'),
    battles = require('../../state/battles'),
    sh = require('shared'),
    _ = require('underscore')._;

exports.battle = {
    issetup: function(req, res) {
        'use strict';
        return res.json({issetup: req.user.battleID !== undefined});
    },
    get: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID);
        return res.json({
            id: battle.id,
            scriptReady: battle.currentTurn.script !== null,
            currentTurnID: battle.currentTurn.id
        });
    },
    getmodel: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID),
            battleJson = battle.battleModel.toJson();
        if (battle.currentTurn) {
            battleJson.orders = battle.currentTurn.playersOrders[playerID];
        }
        return res.json(battleJson);
    },
    sendunitorders: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID),
            playerID = req.user.id,
            unitOrders = new sh.UnitOrders(req.body.ordersJson),
            turn = battle.currentTurn,
            ordersValid = _.all(unitOrders.array, function(order) {
                return order.isValid(battle.battleModel, playerID);
            });
        if (!ordersValid) {
            //chat.log('ERROR: An order was invalid.');
            next(new Error('An order submitted is invalid'));
            return;
        }
        turn.addOrders(unitOrders, playerID);
        /*chat.log('SUCCESS: The orders issued by ' +
            players.playerByID(playerID).name +
            ' have been validated by the server');*/
        return res.json({ok: true});
    },
    ready: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID),
            playerID = req.user.id,
            turn = battle.currentTurn;
        if (turn.isPlayerReady(playerID)) {
            return res.json({wasReady: true});
        }
        turn.setPlayerReady(playerID);
        if (_.uniq(turn.playersSubmitted).length === battle.numberOfPlayers &&
                !turn.script) {
            //all orders have been submitted, generate the script
            battle.generateScript();
        }
        return res.json({wasReady: false});
    },
    getscript: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID);
        return res.json({
            script: battle.currentTurn.script.toJson(),
            resultingServerModel: battle.battleModel.toJson()
        });
    },
    scriptreceived: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID),
            playerID = req.user.id,
            nextTurnCreated,
            index;
        try {
            nextTurnCreated = battle.registerScriptReceived(playerID);
            if (nextTurnCreated) {
                if (battle.winner !== null) {
                    index = _.indexOf(battles, battle);
                    battles.splice(index, 1);
                }
            }
            return res.json({ok: true});
        } catch (e) {
            next(new Error(e.toString()));
        }
    },
    surrender: function(req, res, next) {
        'use strict';
        var battle = battles.get(req.user.battleID);
        battle.surrender(req.user.id);
        exports.battle.ready(req, res, next);
    }
};
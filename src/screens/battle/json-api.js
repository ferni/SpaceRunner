/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/

var battles = require('../../state/battles'),
    sh = require('shared'),
    openSockets = require('../../state/open-sockets'),
    _ = require('underscore')._;

exports.battle = {
    sendunitorders: function(req, res, next) {
        'use strict';
        var battle = battles.getByUser(req.user),
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
    ready: function(req, res) {
        'use strict';
        var battle = battles.getByUser(req.user),
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
            _.each(battle.battleModel.getPlayers(), function(playerID) {
                openSockets.sendTo(playerID, 'script ready', {
                    currentTurnID: battle.currentTurn.id,
                    script: battle.currentTurn.script.toJson(),
                    resultingServerModel: battle.battleModel.toJson()
                });
                battle.registerScriptReceived(playerID);
            });
        }
        return res.json({wasReady: false});
    },
    surrender: function(req, res) {
        'use strict';
        var battle = battles.getByUser(req.user);
        battle.surrender(req.user.id);
        require('../../state/open-sockets')
            .sendTo(battle.getOpponent(req.user.id),
                'opponent surrendered'
                );
        res.json({});
    }
};
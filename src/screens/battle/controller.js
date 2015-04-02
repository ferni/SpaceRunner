/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, hullMaps*/
//HOME
var battles = require('../../state/battles'),
    Player = require('shared/classes/player').Player;

module.exports = function(req, res) {
    'use strict';
    var player = req.user,
        battleServer = battles.getByUser(player),
        playerOrders;
    if (!battleServer) {
        res.render('_common/error', {
            error: 'You\'re not in a battle'
        });
    } else {
        if (battleServer.currentTurn) {
            playerOrders = battleServer.currentTurn.playersOrders[player.id].toJson();
        }
        res.render('battle/view', {
            path: '/battle/',
            bootstrapped: JSON.stringify({
                battleJson: battleServer.battleModel.toJson(),
                hullMaps: hullMaps,
                playerJson: new Player({id: parseInt(player.id, 10)}).toJson(),
                playerOrders: playerOrders
            }),
            player: player
        });
    }
};
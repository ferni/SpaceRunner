/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, hullMaps*/
//HOME
var players = require('../../state/players'),
    battles = require('../../state/battles');

module.exports = function(req, res, next) {
    'use strict';
    var player = req.user,
        battleID = player.battleID,
        battleServer;
    if (battleID === undefined) {
        res.render('_common/error', {
            error: 'You\'re not in a battle'
        });
    } else {
        battleServer = battles.get(battleID);
        res.render('battle/view', {
            path: '/battle/',
            bootstrapped: JSON.stringify({
                battleJson: battleServer.battleModel.toJson(),
                hullMaps: hullMaps,
                playerJson: player.toJson()
            }),
            player: player
        });
    }
};
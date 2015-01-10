/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/
var battles = require('../../state/battles'),
    players = require('../../state/players'),
    prebuiltShips = require('../../state/prebuilt-ships');

exports.ship = {
    remove: function(req, res) {
        'use strict';
        var id = req.body.id;
        prebuiltShips.remove(id).then(function() {
            res.json({});
        }).catch(function(e) {
            res.json({error: e});
        });
    },
    pick: function(req, res) {
        'use strict';
        var player = players.getPlayer(req);
        player.hullID = req.body.id;
        battles.addPlayerToQueue(player);
        res.json({});
    }
};
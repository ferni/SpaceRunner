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
    pick: function(req, res, next) {
        'use strict';
        var player = req.user;
        if (req.body.id === undefined) {
            next(new Error('Must pass an id. (The hull id)'));
        }
        player.set('hullID', req.body.id).then(function() {
            return battles.addPlayerToQueue(player);
        }).then(function() {
            res.json({});
        }).catch(function(e) {
            next(e);
        });
    },
    cancel: function(req, res) {
        'use strict';
        var player = players.getPlayer(req);
        battles.removeFromQueue(player);
        res.json({});
    }
};
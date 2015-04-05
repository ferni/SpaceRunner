/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var players = require('../../state/players'),
    prebuiltShips = require('../../state/prebuilt-ships'),
    battles = require('../../state/battles'),
    _ = require('underscore')._,
    join = require('bluebird').join;

module.exports = function(req, res, next) {
    'use strict';
    var view = req.query.edit ? 'edit' : 'view';
    prebuiltShips.getAll().then(function(hulls) {
        var hullsByTier = _.groupBy(hulls, 'tier'),
            player = req.user,
            battle = battles.getByUser(player);
        if (battle) {
            player.state = 'inBattle';
            players.playerByID(battle.getOpponent(player.id))
                .then(function(opponent) {
                    res.render('ship-list/' + view, {
                        path: '/ship-list/',
                        hullsByTier: hullsByTier,
                        player: player,
                        opponent: opponent.email
                    });
                });
            return;
        }

        if (battles.isUserFinding(player)) {
            player.state = 'finding';
        } else {
            player.state = 'idle';
        }
        res.header('Cache-Control', 'no-cache, private, no-store,' +
            'must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('ship-list/' + view, {
            path: '/ship-list/',
            hullsByTier: hullsByTier,
            player: player
        });
    }).catch (function(e) {
        next(e);
    });
};

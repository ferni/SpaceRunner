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
            battle,
            opponent;
        if (player.state === 'inBattle') {
            battle = battles.get(player.battleID);
            if (!battle) {
                //battle no longer in memory (server might have restarted)
                join(player.set('state', 'idle'), player.set('battleID', undefined));
            } else if (!battle.isPlayerInIt(player.id)) {
                throw new Error('Player is not in the battle his battleID' +
                    ' indicates.');
            } else {
                opponent = battle.getOpponent(player.id).name;
            }
        }
        res.render('ship-list/' + view, {
            path: '/ship-list/',
            hullsByTier: hullsByTier,
            player: player,
            opponent: opponent
        });
    }).catch(function(e) {
        next(e);
    });
};
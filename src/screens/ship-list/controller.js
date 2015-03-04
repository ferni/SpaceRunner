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
            battle = battles.getFor(player),
            opponent;
        if (battle) {
            opponent = battle.getOpponent(player.id).email;
            player.state = 'inBattle';
        } else if (battles.isUserFinding(player)) {
            player.state = 'finding';
        } else {
            player.state = 'idle';
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
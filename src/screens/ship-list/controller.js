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
    _ = require('underscore')._;

module.exports = function(req, res, next) {
    'use strict';
    var view = req.query.edit ? 'edit' : 'view';
    prebuiltShips.getAll().then(function(hulls) {
        var hullsByTier = _.groupBy(hulls, 'tier');
        res.render('ship-list/' + view, {
            path: '/ship-list/',
            hullsByTier: hullsByTier,
            player: players.getPlayer(req)
        });
    }).catch(function(e) {
        next(e);
    });
};
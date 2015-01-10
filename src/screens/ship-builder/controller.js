/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, hullMaps*/
var players = require('../../state/players'),
    prebuiltShips = require('../../state/prebuilt-ships');

module.exports = function(req, res, next) {
    'use strict';
    var shipType = req.query.type,
        hullID = req.query.hull_id;
    if (shipType) {
        //create new ship in the database
        prebuiltShips.create(shipType).then(function(id) {
            res.redirect('/ship-builder?hull_id=' + id);
        }).catch(function(e) {
            next(e);
        });
    } else if (hullID) {
        //pull the ship by hull id from the database
        prebuiltShips.get(hullID).then(function(reply) {
            res.render('ship-builder/view', {
                path: '/ship-builder/',
                shipName: reply.name,
                shipTier: reply.tier,
                bootstrapped: JSON.stringify({
                    shipJson: reply.shipJson,
                    hullID: hullID,
                    hullMaps: hullMaps
                }),
                player: players.getPlayer(req)
            });
        }).catch(function(e) {
            next(e);
        });
    } else {
        res.error('Must specify type or hull_id in query string.');
    }
};

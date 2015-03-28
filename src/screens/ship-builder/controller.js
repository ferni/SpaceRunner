/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, hullMaps*/
var prebuiltShips = require('../../state/prebuilt-ships');

module.exports = {
    create: function(req, res, next) {
        'use strict';
        var shipType = req.query.type;
        if (shipType) {
            //create new ship in the database
            prebuiltShips.create(shipType).then(function(id) {
                console.log('created ship with id: ' + id);
                res.redirect('/ship-builder/' + id);
            }).catch(function(e) {
                next(e);
            });
        } else {
            next(new Error('Must specify type in query string.'));
        }
    },
    edit: function(req, res, next) {
        'use strict';
        var hullID = req.params.id;
        prebuiltShips.get(hullID).then(function(reply) {
            if (!reply) {
                throw 'Hull not found: ' + hullID;
            }
            res.render('ship-builder/view', {
                path: '/ship-builder/',
                shipName: reply.name,
                shipTier: reply.tier,
                bootstrapped: JSON.stringify({
                    shipJson: reply.shipJson,
                    hullID: hullID,
                    hullMaps: hullMaps
                })
            });
        }).catch(function(e) {
            next(e);
        });
    }
};


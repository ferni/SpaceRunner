/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, hullMaps*/
var Ship = require('../_common/shared-js').Ship,
    redis = require('redis');

module.exports = function(req, res, next) {
    'use strict';
    var shipType = req.query.type,
        hullID = req.query.hull_id,
        rc = redis.createClient(),
        newShip;
    if (shipType) {
        //create new ship in the database
        newShip = new Ship({tmxName: shipType});
        rc.incr('next_hull_id', function(error, id) {
            if (error) {
                res.json({error: error});
                return;
            }
            rc.hmset('hull:' + id, {
                name: shipType,
                shipJson: JSON.stringify(newShip.toJson())
            }, function(error, reply) {
                if (error) {
                    res.json({error: error});
                    return;
                }
                rc.rpush(['hull_ids', id], function(error, reply) {
                    if (error) {
                        res.json({error: error});
                        return;
                    }
                    res.redirect('/ship-builder?hull_id=' + id);
                });
            });
        });
    } else if (hullID) {
        //pull the ship by hull id from the database
        rc.hgetall('hull:' + hullID, function(error, reply) {
            if (error) {
                res.error(error);
                return;
            }
            res.render('ship-builder/view', {
                username: 'server-hardcoded username',
                path: '/ship-builder/',
                bootstrapped: JSON.stringify({
                    shipName: reply.name,
                    shipJson: reply.shipJson,
                    hullID: hullID,
                    hullMaps: hullMaps
                })
            });
        });
    } else {
        res.error('Must specify type or hull_id in query string.');
    }

};
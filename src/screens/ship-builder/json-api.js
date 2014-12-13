/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, hullMaps*/
var redis = require('redis');

exports.ship = {
    /**
     * Saves the ship
     * @param {Object} req The request object.
     * @param {Object} res The response object.
     */
    save: function(req, res) {
        'use strict';
        var data = req.body,
            rc = redis.createClient();

        rc.incr('next_hull_id', function(error, id) {
            if (error) {
                res.json({error: error});
                return;
            }
            rc.hmset('hull:' + id, {
                name: data.name,
                shipJson: data.jsonString
            }, function(error, reply) {
                if (error) {
                    res.json({error: error});
                    return;
                }
                rc.hset(['hulls', data.name, id], function(error, reply) {
                    if (error) {
                        res.json({error: error});
                    }
                });
            });
        });
        res.json({});
    },
    /**
     * Loads a ship
     * @param {Object} req The request object.
     * @param {Object} res The response object.
     */
    load: function(req, res) {
        'use strict';
        var name = req.body.name,
            client = redis.createClient();

        client.hget('ships', name, function(error, reply) {
            if (!error) {
                res.json(reply);
            } else {
                res.json(null);
            }
        });
    },
    /**
     * Gets the hull maps.
     * @param {Object} req
     * @param {Object} res
     */
    gethulls: function(req, res) {
        'use strict';
        res.json(hullMaps);
    }
};
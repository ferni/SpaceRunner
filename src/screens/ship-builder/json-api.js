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
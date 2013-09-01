/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, hullMaps*/
var redis = require('redis');

/**
* Saves the ship
* @param {Object} req The request object.
* @param {Object} res The response object.
*/
exports.save = function(req, res) {
    'use strict';
    var data = req.body,
        client = redis.createClient();

    client.hset('ships', data.name, data.buildings, function(error, reply) {
        res.json({error: error, reply: reply});
    });
};

/**
* Loads a ship
* @param {Object} req The request object.
* @param {Object} res The response object.
*/
exports.load = function(req, res) {
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
};

/**
 * Gets the hull maps.
 * @param {Object} req
 * @param {Object} res
 */
exports.gethulls = function(req, res) {
    'use strict';
    res.json(hullMaps);
};


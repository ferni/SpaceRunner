/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, hullMaps*/
var redis = require('redis');

exports.ship = {
    remove: function(req, res) {
        'use strict';
        var id = req.body.id,
            rc = redis.createClient();
        rc.hget(['hull:' + id, 'name'], function(error, reply) {
            if (error) {
                return res.json({error: error});
            }
            rc.hdel(['hulls', reply], function(error, reply) {
                if (error) {
                    return res.json({error: error});
                }
                rc.del('hull:' + id, function(error, reply) {
                    if (error) {
                        return res.json({error: error});
                    }
                    res.json({});
                });
            });
        });
    }
};
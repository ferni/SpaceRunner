/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/

var redis = require('redis'),
    _ = require('underscore')._;

function getAll(cb) {
    'use strict';
    var rc = redis.createClient();
    function renderIfLoaded(ids, hulls) {
        if (hulls.length === ids.length) {
            cb(null, hulls);
        }
    }
    rc.lrange(['hull_ids', 0, -1], function(error, ids) {
        var hulls = [];
        if (error) {
            cb(error);
        }
        renderIfLoaded(ids, hulls);
        _.each(ids, function(hullID) {
            rc.hget(['hull:' + hullID, 'name'], function(error, reply) {
                if (error) {
                    cb(error);
                }
                hulls.push({
                    id: hullID,
                    name: reply
                });
                renderIfLoaded(ids, hulls);
            });
        });
    });
}

function get(id, cb) {
    'use strict';
    var rc = redis.createClient();
    rc.hgetall('hull:' + id, function(error, reply) {
        if (error) {
            cb(error);
        } else {
            cb(null, reply);
        }
    });
}

exports.getAll = getAll;
exports.get = get;
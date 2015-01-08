/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/

var redis = require('redis'),
    _ = require('underscore')._,
    Ship = require('shared').Ship;

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

function get(id) {
    'use strict';
    var rc = redis.createClient();
    return rc.hgetallAsync('hull:' + id);
}

function create(shipType) {
    'use strict';
    var rc = redis.createClient(),
        newShip = new Ship({tmxName: shipType});
    return rc.incrAsync('next_hull_id').then(function(id) {
        return rc.hmsetAsync('hull:' + id, {
            name: shipType,
            shipJson: JSON.stringify(newShip.toJson())
        }).then(function() {
            return id;
        });
    }).then(function(id) {
        return rc.rpushAsync(['hull_ids', id]).then(function() {
            return id;
        });
    });
}

exports.getAll = getAll;
exports.get = get;
exports.create = create;
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

function getAll() {
    'use strict';
    var rc = redis.createClient();
    return rc.lrangeAsync(['hull_ids', 0, -1]).map(function(id) {
        return rc.hgetAsync(['hull:' + id, 'name']).then(function(reply) {
            return {
                id: id,
                name: reply
            };
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
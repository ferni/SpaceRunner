/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/

var redis = require('redis'),
    rc = redis.createClient(),
    join = require('bluebird').join,
    _ = require('underscore')._,
    Ship = require('shared').Ship;

module.exports = {
    getAll: function() {
        'use strict';
        return rc.lrangeAsync(['hull_ids', 0, -1]).map(function (id) {
            return join(
                rc.hgetAsync(['hull:' + id, 'name']),
                rc.hgetAsync(['hull:' + id, 'tier'])
            ).then(function (reply) {
                return {
                    id: id,
                    name: reply[0],
                    tier: reply[1]
                };
            });
        });
    },
    get: function(id) {
        'use strict';
        return rc.hgetallAsync('hull:' + id);
    },
    getTier: function(id) {
        'use strict';
        return rc.hgetAsync(['hull:' + id, 'tier']);
    },
    create: function(shipType) {
        'use strict';
        var newShip = new Ship({tmxName: shipType});
        return rc.incrAsync('next_hull_id').then(function (id) {
            return rc.hmsetAsync('hull:' + id, {
                name: shipType,
                tier: 1,
                shipJson: JSON.stringify(newShip.toJson())
            }).then(function () {
                return id;
            });
        }).then(function (id) {
            return rc.rpushAsync(['hull_ids', id]).then(function () {
                return id;
            });
        });
    },
    remove: function(id) {
        'use strict';
        return join(rc.lremAsync(['hull_ids', 0, id]),
            rc.delAsync('hull:' + id));
    },
    update: function(id, values) {
        'use strict';
        return rc.hmsetAsync('hull:' + id, values);
    }
};

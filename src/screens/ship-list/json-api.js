/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, hullMaps*/
var redis = require('redis'),
    queue = require('../_common/server-js/queue'),
    auth = require('../_common/server-js/auth');

exports.ship = {
    remove: function(req, res) {
        'use strict';
        var id = req.body.id,
            rc = redis.createClient(),
            tasksDone = 0;
        function taskDone() {
            tasksDone++;
            if (tasksDone >= 2) {
                res.json({});
            }
        }
        rc.lrem(['hull_ids', 0, id], function(error, reply) {
            if (error) {
                return res.json({error: error});
            }
            taskDone();
        });
        rc.del('hull:' + id, function(error, reply) {
            if (error) {
                return res.json({error: error});
            }
            taskDone();
        });
    },
    pick: function(req, res) {
        'use strict';
        var player = auth.getPlayer(req);
        player.hullID = req.body.id;
        queue.addPlayer(player.id);
        res.json({});
    }
};
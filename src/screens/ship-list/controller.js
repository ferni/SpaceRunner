/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var auth = require('../_common/server-js/auth'),
    redis = require('redis'),
    _ = require('underscore')._;

module.exports = function(req, res, next) {
    'use strict';
    var rc = redis.createClient();
    function renderIfLoaded(ids, hulls) {
        if (hulls.length === ids.length) {
            res.render('ship-list/view', {
                path: '/ship-list/',
                hulls: hulls
            });
        }
    }
    rc.lrange(['hull_ids', 0, -1], function(error, ids) {
        var hulls = [];
        if (error) {
            return res.render('_common/error', {error: error});
        }
        renderIfLoaded(ids, hulls);
        _.each(ids, function(hullID) {
            rc.hget(['hull:' + hullID, 'name'], function(error, reply) {
                if (error) {
                    return res.render('_common/error', {error: error});
                }
                hulls.push({
                    id: hullID,
                    name: reply
                });
                renderIfLoaded(ids, hulls);
            });
        });
    });

};
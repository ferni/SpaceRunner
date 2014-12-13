/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var auth = require('../_common/server-js/auth'),
    redis = require('redis');

module.exports = function(req, res, next) {
    'use strict';
    var rc = redis.createClient();
    rc.hgetall('hulls', function(error, reply) {
        res.render('ship-list/view', {
            path: '/ship-list/',
            hulls: reply
        });
    });

};
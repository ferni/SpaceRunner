/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, battleSetUps*/

var _ = require('underscore')._,
    routes = require('./routes/index');

routes.add('get', function(req, res, next) {
    'use strict';
    try {
        res.json({
            battleSetUps: _.map(battleSetUps, function(b) {
                return b.toJson();
            })
        });
    } catch (e) {
        console.log(e);
        next(new Error(e));
    }
});

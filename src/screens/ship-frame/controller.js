/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, hullMaps*/

module.exports = function(req, res, next) {
    'use strict';
    res.render('ship-frame/view', {
        path: '/ship-frame/',
        bootstrapped: {
            hullMaps: hullMaps
        }
    });
};
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/

var routes = require('./routes'),
    screens = ['battle', 'lobby', 'battle-set-up'];

/**
 * Calls routes.configureRoutes with the registered screens. (screens array)
 * @param {*} app
 */
exports.configureRoutes = function(app) {
    'use strict';
    routes.configureRoutes(app, screens);
};

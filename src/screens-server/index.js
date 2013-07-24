/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var routes = require('./routes'),
    screens = ['battle','lobby','battle-set-up'];

exports.configureRoutes = function(app) {
    routes.configureRoutes(app, screens);
};
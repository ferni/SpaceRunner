/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/
var _ = require('underscore')._;

exports.register = function(app) {
    'use strict';
    //Screens
    app.get('/', require('./screens/ship-list/controller'));
    app.get('/ship-builder', require('./screens/ship-builder/controller'));
    app.get('/ship-list', require('./screens/ship-list/controller'));
    app.get('/choose-type', require('./screens/choose-type/controller'));

    //JSON API
    _.each(['ship-builder', 'ship-list'], function(screen) {
        _.each(require('./screens/' + screen + '/json-api'),
            function(apiGroup, groupName) {
                _.each(apiGroup, function(callback, methodName) {
                    app.post('/' + groupName + '/' + methodName, callback);
                });
            });
    });
};


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
    _.each(['ship-builder', 'ship-list', 'battle', 'ship-frame'], function(screen) {
        app.get('/' + screen, require('./screens/' + screen + '/controller'));
    });

    //json api
    _.each(['ship-builder', 'ship-list', 'battle'], function(screen) {
        app.get('/' + screen, require('./screens/' + screen + '/controller'));
        _.each(require('./screens/' + screen + '/json-api'),
            function(apiGroup, groupName) {
                _.each(apiGroup, function(callback, methodName) {
                    app.post('/' + groupName + '/' + methodName, callback);
                });
            });
    });
};


/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/
var routes = [];

/**
 * Registers a route for the screen.
 * @param {String} url
 * @param {Function} callback
 */
exports.add = function(url, callback) {
    'use strict';
    routes.push({
        url: url,
        callback: callback
    });
};

/**
 * Registers with the app all the routes that have been added with add.
 * @param {*} app
 * @param {Array} screenNames
 */
exports.configureRoutes = function(app, screenNames) {
    'use strict';
    var i, r, url;
    console.log('Configured the following entry points for the screens ' +
        '(POST):');
    for (i = screenNames.length - 1; i >= 0; i--) {
        routes = [];
        require('../' + screenNames[i] + '-screen-server');//here it loads the routes
        //configure routes for that screen through app
        for (r = routes.length - 1; r >= 0; r--) {
            url = '/' + screenNames[i] + '/' + routes[r].url;
            app.post(url, routes[r].callback);
            console.log('   ' + url);
        }
    }
};

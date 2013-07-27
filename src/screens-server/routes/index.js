/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */
var routes = [];

exports.add = function(url, callback){
    routes.push({
        url: url,
        callback: callback
    });
};

exports.configureRoutes = function(app, screenNames) {
    var i, r, url;
    console.log('Configured the following entry points for the screens (POST):');
    for (i = screenNames.length - 1; i >= 0; i--) {
        routes = [];
        require('../' + screenNames[i]);//here it loads the routes
        //configure routes for that screen through app
        for (r = routes.length - 1; r >= 0; r--) {
            url = '/' + screenNames[i] + '/' + routes[r].url;
            app.post(url, routes[r].callback);
            console.log('   ' + url);
        }
    }
};
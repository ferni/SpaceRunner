/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/
var _ = require('underscore')._,
    passport = require('passport');

exports.register = function(app) {
    'use strict';
    //Screens
    app.get('/', require('./screens/ship-list/controller'));
    _.each(['ship-builder', 'ship-list', 'battle',
        'ship-frame', 'choose-type'], function(screen) {
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


    app.get('/signup', function(req, res) {
        res.render('signup', { message: req.flash('signupMessage') });
    });
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
};


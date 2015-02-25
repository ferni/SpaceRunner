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
        successRedirect : '/',
        failureRedirect : '/signup',
        failureFlash : true
    }));

    app.get('/login', function(req, res) {
        res.render('login', { message: req.flash('loginMessage') });
    });
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/',
        failureRedirect : '/login',
        failureFlash : true
    }));

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });
};


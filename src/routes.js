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
    function loginRedirect(req, res, next) {
        if (!req.isAuthenticated()) {
            return res.redirect('/login');
        }
        next();
    }
    function loginError(req, res, next) {
        if (!req.isAuthenticated()) {
            return res.send(401);
        }
        next();
    }

    //Screens
    app.get('/', loginRedirect, require('./screens/ship-list/controller'));
    _.each(['ship-list', 'battle', 'ship-frame', 'choose-type'], function(screen) {
        app.get('/' + screen,
            loginRedirect,
            require('./screens/' + screen + '/controller'));
    });
    app.get('/ship-builder/',
        loginRedirect,
        require('./screens/ship-builder/controller').create);
    app.get('/ship-builder/:id',
        loginRedirect,
        require('./screens/ship-builder/controller').edit);
    //json api
    _.each(['ship-builder', 'ship-list', 'battle', '_common'], function(screen) {
        _.each(require('./screens/' + screen + '/json-api'),
            function(apiGroup, groupName) {
                _.each(apiGroup, function(callback, methodName) {
                    app.post('/' + groupName + '/' + methodName,
                        loginError,
                        callback);
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


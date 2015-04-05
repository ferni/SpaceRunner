/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, process*/
// load all the things we need
var LocalStrategy = require('passport-local').Strategy,
    players = require('../state/players'),
    bcrypt = require('bcrypt-nodejs'),
    Bromise = require('bluebird');
Bromise.promisifyAll(bcrypt);

function hashPass(password) {
    'use strict';
    return bcrypt.genSaltAsync(8).then(function(salt) {
        return bcrypt.hashAsync(password, salt, null);
    });
}

function isPasswordValid(password, user) {
    'use strict';
    return bcrypt.compareAsync(password, user.pass);
}

module.exports = function(passport) {
    'use strict';
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        players.playerByID(id).then(function(user) {
            done(null, user);
        }).catch (function(e) {
            done(e);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        function(req, email, password, done) {
            process.nextTick(function() {
                players.exists(email).then(function(exists) {
                    if (exists) {
                        return done(null, false,
                            req.flash('signupMessage',
                                'That email is already taken.'));
                    }
                    return hashPass(password).then(function(hashedPass) {
                        return players.createNewPlayer(email, hashedPass);
                    }).then(function(player) {
                        return done(null, player);
                    });
                }).catch (function(err) {
                    done(err);
                });
            });
        }));
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        function(req, email, password, done) {
            players.byEmail(email).then(function(user) {
                if (!user) {
                    return done(null, false, req.flash('loginMessage',
                        'Invalid e-mail/password combination.'));
                }
                return isPasswordValid(password, user).then(function(valid) {
                    if (valid) {
                        return done(null, user);
                    }
                    return done(null, false, req.flash('loginMessage',
                        'Invalid e-mail/password combination.'));
                });
            }).catch (function(err) {
                done(err);
            });
        }));
};

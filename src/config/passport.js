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
    bcrypt = require('bcrypt-nodejs');

function hashPass(password) {
    'use strict';
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

function isPasswordValid(password, user) {
    'use strict';
    return bcrypt.compareSync(password, user.pass);
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
                    return players.createNewPlayer(email, hashPass(password))
                        .then(function(player) {
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
                if (!user || !isPasswordValid(password, user)) {
                    return done(null, false, req.flash('loginMessage',
                        'Invalid e-mail/password combination.'));
                }
                return done(null, user);
            }).catch (function(err) {
                done(err);
            });
        }));
};

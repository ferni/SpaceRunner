/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var auth = require('../_common/server-js/auth');

/**
 * Initializes the entire app. Creates the player
 session, or returns the player state if a session is
 already present.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
    'use strict';
    var player;
    console.log(req.session);
    if (req.session.playerID === undefined) {
        //create the player
        try {
            player = auth.createNewPlayer();
            req.session.playerID = player.id;
        } catch (e) {
            next(new Error('Could not create new player'));
        }

    } else {
        try {
            player = auth.getPlayer(req);
        } catch (e2) {
            next(new Error('Expected player to be logged in'));
        }
    }
    res.render('home/view', {
        username: player.name
    });
};
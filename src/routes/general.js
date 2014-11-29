/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/

var auth = require('../auth'),
    sh = require('../shared');

/**
 * Initializes the entire app. Creates the player
 session, or returns the player state if a session is
 already present.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
exports.init = function(req, res, next) {
//  TODO: Move this to the on connection callback when socket.io is implemented
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
    res.json({
        player: player.toJson(),
        battleID: req.session.battleID
    });
};

/**
 * Checks if the server is online.
 * @param {Object} req
 * @param {Object} res
 */
exports.ping = function(req, res) {
    'use strict';
    res.json({ ok: true });
};

/**
 * Gets an array of all the properties of sh , (the namespace for the
 * shared code between server and client.
 * This is used to compare the properties of server and client to
 * ensure that they are the same.
 * @param {Object} req
 * @param {Object} res
 */
exports.sharedprops = function(req, res) {
    'use strict';
    res.json({properties: sh.getProperties(sh)});
};


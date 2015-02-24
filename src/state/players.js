/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/

var _ = require('underscore')._,
    sh = require('shared'),
    rc = require('../config/redis-client'),
    join = require('bluebird'),
    //chat = require('./chat'),
    currentPlayers = []; //filled with sh.Player;

/**
* Gets the id of the player in session.
* @param {*} req
* @return {int}
*/
exports.getID = function(req) {
    'use strict';
    //check that there's a player
    if (!req.user) {
        throw 'Player not in session';
    }
    var id = req.user.id;
    return parseInt(id, 10);
};

/**
* Gets the player given an id.
* @param {int} id
* @return {*}
*/
exports.playerByID = function(id) {
    'use strict';
    return rc.hgetallAsync('user:' + id);
};

/**
 * Gets the player in session.
 * @param {*} req
 * @return {*}
 */
exports.getPlayer = function(req) {
    'use strict';
    return exports.playerByID(exports.getID(req));
};

/**
 * Converts the name so it's different than all the others adding a number
 * at the end.
 * @param {String} playerName
 * @return {String}
 */
exports.toUniqueName = function(playerName) {
    'use strict';
    var newName = playerName,
        number = 1;
    function hasNameEqualToNewName(player) {
        return player.name === newName;
    }
    while (_.any(currentPlayers, hasNameEqualToNewName)) {
        newName = playerName + number.toString();
        number++;
    }
    return newName;
};

/**
 * Creates a new player and add it to currentPlayers.
 * @return {sh.Player}
 */
exports.createNewPlayer = function(email, pass) {
    'use strict';
    var userHash = {
        email: email,
        pass: pass,
        state: 'idle'
    };
    return rc.incrAsync('next_user_id').then(function(id) {
        userHash.id = id;
        return rc.hmsetAsync('user:' + id, userHash).then(function() {
            return rc.hsetAsync('users', email, id);
        });
    }).then(function() {
        return userHash;
    });
};

exports.exists = function(email) {
    'use strict';
    return rc.hexistsAsync('users', email);
};

/**
 * Checks if the player is in currentPlayers.
 * @param {int} playerID
 * @return {bool}
 */
exports.isOnline = function(playerID) {
    'use strict';
    return _.any(currentPlayers, function(p) {
        return p.id === playerID;
    });
};

exports.byEmail = function(email) {
    'use strict';
    return rc.hgetAsync('users', email).then(function(id) {
        return rc.hgetallAsync('user:' + id);
    });
};
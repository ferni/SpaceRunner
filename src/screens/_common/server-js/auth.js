/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/

var _ = require('underscore')._,
    sh = require('../shared-js'),
    chat = require('./chat'),
    currentPlayers = []; //filled with sh.Player;

/**
* Gets the id of the player in session.
* @param {*} req
* @return {int}
*/
exports.getID = function(req) {
    'use strict';
    //check that there's a player
    var id = req.session.playerID;
    if (id === undefined) {
        throw 'Player not in session';
    }
    return parseInt(id, 10);
};

/**
* Gets the player given an id.
* @param {int} id
* @return {*}
*/
exports.playerByID = function(id) {
    'use strict';
    return _.find(currentPlayers, function(p) {
        return p.id === id;
    });
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
exports.createNewPlayer = function() {
    'use strict';
    var player = new sh.Player({
        id: currentPlayers.length,
        name: exports.toUniqueName('Player')
    });
    chat.log('Player "' + player.name + '" connected to server.');
    currentPlayers.push(player);
    return player;
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

/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports*/
var auth = require('../auth'),
    sh = require('../public/js/shared');

/*
Initializes the entire app. Creates the player
session, or returns the player state if a session is
already present.

TODO: Move this to the on connection callback when socket.io is implemented
 */
exports.init = function(req, res, next) {
    var player;
    console.log(req.session);
    if (typeof req.session.playerID === 'undefined') {
        //create the player
        try{
            player = auth.createNewPlayer();
            req.session.playerID = player.id;
        }catch(e){
            next(new Error('Could not create new player'));
        }

    } else {
        try{
            player = auth.getPlayer(req);
        }catch(e) {
            next(new Error('Expected player to be logged in'));
        }
    }
    res.json({
        player: player.toJson(),
        battleID: req.session.battleID
    });
};

exports.ping = function(req, res) {
  'use strict';
  res.json({ ok: true });
};

//used for testing
exports.sharedprops = function(req, res) {
    'use strict';
    res.json({properties: sh.getProperties(sh)});
};

exports.disconnect = function(req, res, next) {
    try{
        auth.disconnect(req);
        res.json({ok:true});
    }catch(e) {
        next(new Error('Error while trying to disconnect'));
    }
};
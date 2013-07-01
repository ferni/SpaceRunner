/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

var model = require('../model'),
    _ = require('underscore')._,
    auth = require('../auth');

/**
 * sets the initial info for the player
 * and fetches the initial data
 */
exports.get = function(req, res) {
    var player;
    console.log(req.session);
    if (typeof req.session.playerID === 'undefined') {
        //create the player
        player = auth.createNewPlayer();
        req.session.playerID = player.id;
        currentPlayers.push(player);

    } else {
        player = auth.getPlayer();
    }
    console.log((new model.Ship('asdf')).tmxName);
    res.json({
        playerName: player.name,
        battles: _.map(battles, function(b){
            return b.jsonForLobby();
        })
    });
};

/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

var model = require('../model'),
    _ = require('underscore')._;

/**
 * sets the initial info for the player
 * and fetches the initial data
 */
exports.get = function(req, res) {
    var player;
    console.log(req.session);
    if (req.session.playerID === undefined) {
        //create the player
        player = model.createNewPlayer();
        req.session.playerID = player.id;
        currentPlayers.push(player);

    } else {
        player = _.find(currentPlayers, function(p){
            return p.id === req.session.playerID;
        });

        if (!player) {
            throw 'playerID stored in session not found among currentPlayers';
        }
    }
    console.log((new model.Ship('asdf')).tmxName);
    res.json({
        playerName: player.name,
        battles: _.map(battles, function(b){
            return b.jsonForLobby();
        })
    });
};

/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

var _ = require('underscore')._,
    auth = require('../auth'),
    routes = require('./routes/index');

/**
 * sets the initial info for the player
 * and fetches the initial data
 */
routes.add('get', function(req, res, next) {
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
        battleSetUps: _.map(battleSetUps, function(b){
            return b.toJson();
        })
    });
});

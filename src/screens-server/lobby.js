/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

var _ = require('underscore')._,
    auth = require('../auth'),
    routes = require('./routes/index');

routes.add('get', function(req, res, next) {
    try{
        var player = auth.getPlayer(req);
        res.json({
            player: player.toJson(),
            battleSetUps: _.map(battleSetUps, function(b){
                return b.toJson();
            })
        });
    }catch(e) {
        console.log(e);
        next(new Error(e));
    }
});

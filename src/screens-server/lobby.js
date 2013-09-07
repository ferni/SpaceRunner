/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, battleSetUps*/

var _ = require('underscore')._,
    routes = require('./routes/index'),
    sh = require('../public/js/shared'),
    model = require('../model.js'),
    auth = require('../auth.js');

routes.add('get', function(req, res, next) {
    'use strict';
    try {
        res.json({
            battleSetUps: _.map(battleSetUps, function(b) {
                return b.toJson();
            })
        });
    } catch (e) {
        console.log(e);
        next(new Error(e));
    }
});

routes.add('newchallenge', function(req, res, next) {
    'use strict';
    var player = auth.getPlayer(req),
        ship,
        battle;
    if (player) {
        ship = new sh.Ship({tmxName: 'mechanoid_cruiser'});
        ship.putUnit({owner: player});
        ship.putUnit({owner: player});
        ship.putUnit({owner: player});
        battle = new model.Battle({id: battles.length, ship: ship});
        battle.playerLeft = player;
        battle.playerRight = new model.Player({id: -1, name: 'Enemy'});
        battles.push(battle);
        battle.nextTurn();
        res.json(battle.toJson());
    } else {
        next(new Error('No player in session'));
    }
});

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
    try {
        var player = auth.getPlayer(req),
            battle,
            challengeShips,
            challengeIndex = req.body.challengeIndex;
        if (player) {
            challengeShips = [{
                tmxName: 'Cyborg_Frigate',
                buildings: [
                    {type: 'Weapon', id: 3, x: 26, y: 6, r: false},
                    {type: 'Weapon', id: 5, x: 26, y: 26, r: false},
                    {type: 'Engine', id: 7, x: 10, y: 14, r: false},
                    {type: 'Engine', id: 8, x: 10, y: 18, r: false},
                    {type: 'Console', id: 9, x: 14, y: 14, r: false},
                    {type: 'Console', id: 10, x: 14, y: 20, r: false},
                    {type: 'Console', id: 12, x: 24, y: 26, r: false},
                    {type: 'Console', id: 13, x: 24, y: 8, r: false},
                    {type: 'WeakSpot', id: 14, x: 18, y: 16, r: false}
                ],
                units: [],
                GRID_SUB: 2
            }, {'tmxName': 'Mechanoid_Cruiser',
                'buildings': [{'type': 'Door', 'x': 14, 'y': 11, 'r': true},
                    {'type': 'Wall', 'x': 14, 'y': 8, 'r': false},
                    {'type': 'Wall', 'x': 17, 'y': 8, 'r': false},
                    {'type': 'Door', 'x': 15, 'y': 8, 'r': false},
                    {'type': 'Wall', 'x': 14, 'y': 15, 'r': false},
                    {'type': 'Wall', 'x': 17, 'y': 15, 'r': false},
                    {'type': 'Door', 'x': 15, 'y': 15, 'r': false},
                    {'type': 'Engine', 'x': 10, 'y': 5, 'r': false},
                    {'type': 'Engine', 'x': 10, 'y': 17, 'r': false},
                    {'type': 'Engine', 'x': 11, 'y': 11, 'r': false},
                    {'type': 'Console', 'x': 11, 'y': 10, 'r': false},
                    {'type': 'Weapon', 'x': 24, 'y': 8, 'r': false},
                    {'type': 'Weapon', 'x': 24, 'y': 14, 'r': false},
                    {'type': 'Weapon', 'x': 20, 'y': 17, 'r': false},
                    {'type': 'Component', 'x': 10, 'y': 7, 'r': false},
                    {'type': 'Component', 'x': 10, 'y': 15, 'r': false},
                    {'type': 'Console', 'x': 12, 'y': 5, 'r': false},
                    {'type': 'Console', 'x': 12, 'y': 18, 'r': false},
                    {'type': 'Weapon', 'x': 20, 'y': 5, 'r': false},
                    {'type': 'Power', 'x': 20, 'y': 15, 'r': false},
                    {'type': 'Power', 'x': 20, 'y': 7, 'r': false},
                    {'type': 'Console', 'x': 25, 'y': 10, 'r': false},
                    {'type': 'Console', 'x': 25, 'y': 13, 'r': false},
                    {'type': 'Console', 'x': 19, 'y': 18, 'r': false},
                    {'type': 'Console', 'x': 19, 'y': 5, 'r': false},
                    {'type': 'Door', 'x': 22, 'y': 11, 'r': true},
                    {'type': 'WeakSpot', 'x': 15, 'y': 6, 'r': false},
                    {'type': 'WeakSpot', 'x': 15, 'y': 16, 'r': false},
                    {'type': 'WeakSpot', 'x': 19, 'y': 11, 'r': false},
                    {'type': 'Door', 'x': 18, 'y': 11, 'r': true}],
                'units': [],
                'GRID_SUB': 1},
                {'tmxName': 'Humanoid_Battleship', 'buildings': [
                    {'type': 'Engine', 'x': 22, 'y': 16, 'r': false},
                    {'type': 'Engine', 'x': 22, 'y': 52, 'r': false},
                    {'type': 'Engine', 'x': 28, 'y': 42, 'r': false},
                    {'type': 'Engine', 'x': 28, 'y': 26, 'r': false},
                    {'type': 'Console', 'x': 26, 'y': 16, 'r': false},
                    {'type': 'Console', 'x': 26, 'y': 54, 'r': false},
                    {'type': 'Console', 'x': 32, 'y': 42, 'r': false},
                    {'type': 'Console', 'x': 32, 'y': 28, 'r': false},
                    {'type': 'Weapon', 'x': 54, 'y': 46, 'r': false},
                    {'type': 'Weapon', 'x': 54, 'y': 40, 'r': false},
                    {'type': 'Weapon', 'x': 54, 'y': 22, 'r': false},
                    {'type': 'Weapon', 'x': 54, 'y': 28, 'r': false},
                    {'type': 'Console', 'x': 56, 'y': 26, 'r': false},
                    {'type': 'Console', 'x': 56, 'y': 44, 'r': false},
                    {'type': 'Console', 'x': 54, 'y': 26, 'r': false},
                    {'type': 'Console', 'x': 54, 'y': 44, 'r': false},
                    {'type': 'Wall', 'x': 38, 'y': 30, 'r': false},
                    {'type': 'Wall', 'x': 40, 'y': 30, 'r': false},
                    {'type': 'Wall', 'x': 46, 'y': 30, 'r': false},
                    {'type': 'Wall', 'x': 48, 'y': 30, 'r': false},
                    {'type': 'Wall', 'x': 50, 'y': 30, 'r': false},
                    {'type': 'Wall', 'x': 50, 'y': 40, 'r': false},
                    {'type': 'Wall', 'x': 48, 'y': 40, 'r': false},
                    {'type': 'Wall', 'x': 46, 'y': 40, 'r': false},
                    {'type': 'Wall', 'x': 40, 'y': 40, 'r': false},
                    {'type': 'Wall', 'x': 38, 'y': 40, 'r': false},
                    {'type': 'Wall', 'x': 36, 'y': 40, 'r': false},
                    {'type': 'Wall', 'x': 36, 'y': 38, 'r': false},
                    {'type': 'Wall', 'x': 36, 'y': 32, 'r': false},
                    {'type': 'Wall', 'x': 36, 'y': 30, 'r': false},
                    {'type': 'Door', 'x': 36, 'y': 34, 'r': true},
                    {'type': 'Door', 'x': 42, 'y': 30, 'r': false},
                    {'type': 'Door', 'x': 42, 'y': 40, 'r': false},
                    {'type': 'WeakSpot', 'x': 42, 'y': 44, 'r': false},
                    {'type': 'WeakSpot', 'x': 42, 'y': 24, 'r': false},
                    {'type': 'WeakSpot', 'x': 38, 'y': 34, 'r': false},
                    {'type': 'Power', 'x': 46, 'y': 36, 'r': false},
                    {'type': 'Console', 'x': 50, 'y': 38, 'r': false},
                    {'type': 'Power', 'x': 46, 'y': 32, 'r': false},
                    {'type': 'Console', 'x': 50, 'y': 32, 'r': false},
                    {'type': 'Wall', 'x': 48, 'y': 46, 'r': false},
                    {'type': 'Wall', 'x': 48, 'y': 24, 'r': false},
                    {'type': 'Wall', 'x': 38, 'y': 46, 'r': false},
                    {'type': 'Wall', 'x': 38, 'y': 24, 'r': false},
                    {'type': 'Door', 'x': 38, 'y': 42, 'r': true},
                    {'type': 'Door', 'x': 48, 'y': 42, 'r': true},
                    {'type': 'Door', 'x': 38, 'y': 26, 'r': true},
                    {'type': 'Door', 'x': 48, 'y': 26, 'r': true},
                    {'type': 'Wall', 'x': 50, 'y': 36, 'r': false},
                    {'type': 'Wall', 'x': 50, 'y': 34, 'r': false},
                    {'type': 'Component', 'x': 52, 'y': 16, 'r': false},
                    {'type': 'Component', 'x': 52, 'y': 52, 'r': false}
                ], 'units': [], 'GRID_SUB': 2}];
            if (challengeIndex < 0 ||
                    challengeIndex >= challengeShips.length) {
                next(new Error('Challenge index ' + challengeIndex +
                    ' out of bounds.'));
            }
            battle = new model.ChallengeBatte({
                id: battles.length,
                player: player,
                shipJson: challengeShips[challengeIndex]
            });
            battles.push(battle);
            battle.nextTurn();
            res.json(battle.toJson());
        } else {
            next(new Error('No player in session'));
        }
    } catch (e) {
        next(e);
    }
});

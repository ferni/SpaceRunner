/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, battleSetUps*/

var BattleSetUp = require('./').BattleSetUp,
    auth = require('../state/players'),
    _ = require('underscore')._,
    routes = require('./routes');

routes.add('get', function(req, res, next) {
    'use strict';
    var id = parseInt(req.body.id, 10),
        bsu = _.find(battleSetUps, function(bsu) {
            return bsu.id === id;
        }),
        playerID = players.getID(req);
    if (!bsu) {
        next(new Error('No battleSetUp with id ' + id));
        return;
    }
    //authenticate
    if (bsu.creator.id === playerID ||
            (bsu.challenger && bsu.challenger.id === playerID)) {
        if (bsu.battle) {
            //host has had clicked "start" and the battle model is ready.
            //load the battle id in session for persistence on browser refresh
            req.session.battleID = bsu.battle.id;
        }
        try {
            bsu.updatePlayers();
            res.json(bsu.toJson());
        } catch (e) {
            next(e);
        }
    } else {
        next(new Error('Only a player from within the battle can request' +
            ' battle details.'));
    }
});

routes.add('start', function(req, res, next) {
    'use strict';
    var id = parseInt(req.body.id, 10),
        bsu = _.find(battleSetUps, function(bsu) {
            return bsu.id === id;
        }),
        playerID = players.getID(req);
    if (!bsu.isFull()) {
        next(new Error("Battle can't start unless both players are present."));
        return;
    }
    if (bsu.creator.id === playerID ||
            (bsu.challenger && bsu.challenger.id === playerID)) {
        bsu.createBattle(function(err) {
            if (err) {
                next(err);
            } else {
                res.json({});
            }
        });
    } else {
        next(new Error('Only a player from within the battle can request' +
            ' battle start.'));
    }
});

routes.add('create', function(req, res, next) {
    'use strict';
    var id = battleSetUps.length,
        bsu;
    console.log('creating...');
    if (!req.body.shipJson) {
        next(new Error('shipJson must be provided'));
    }
    bsu = new BattleSetUp({
        id: id,
        creator: players.getPlayer(req),
        shipJson: req.body.shipJson
    });
    battleSetUps.push(bsu);
    res.json(bsu.toJson());
});


routes.add('join', function(req, res, next) {
    'use strict';
    var battleID = parseInt(req.body.battleID, 10),
        battle;
    if (isNaN(battleID)) {
        return next(new Error('battleID not provided or not a number.'));
    }
    battle = _.find(battleSetUps, function(b) {
        return b.id === battleID;
    });
    if (!battle) {
        return next(new Error('battle ' + battleID + ' not found'));
    }
    if (battle.isFull()) {
        res.json({error: 'battle is full'});
    } else {
        battle.addPlayer(players.getPlayer(req));
        res.json(battle.toJson());
    }
});

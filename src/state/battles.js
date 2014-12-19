/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports*/
var sh = require('shared'),
    BattleServer = require('../classes/battle-server'),
    prebuiltShips = require('./prebuilt-ships'),
    players = require('./players');

var playersWaiting = [],
    battleServers = [];

function createBattle(players) {
    'use strict';
    var ship1,
        ship2,
        battleServer,
        U = sh.Unit,
        shipJsons = [];
    function fetchedShip() {
        if (shipJsons.length < 2) {
            return;
        }
        battleServer = new BattleServer({
            id: battleServers.length,
            shipJsons: shipJsons
        });
        ship1 = battleServer.battleModel.ships[0];
        ship1.owner = players[0];
        ship1.putUnit(new U({imgIndex: 6, speed: 2}));
        ship1.putUnit(new U({imgIndex: 6, speed: 2}));
        ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));
        ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));

        ship2 = battleServer.battleModel.ships[1];
        ship2.owner = players[1];
        ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
        ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
        ship2.putUnit(new U({imgIndex: 12, speed: 2}));
        ship2.putUnit(new U({imgIndex: 12, speed: 2}));

        battleServers.push(battleServer);
        battleServer.nextTurn();
    }
    prebuiltShips.get(players[0].hullID, function(error, reply) {
        shipJsons.push(JSON.parse(reply.shipJson));
        fetchedShip();
    });
    prebuiltShips.get(players[1].hullID, function(error, reply) {
        shipJsons.push(JSON.parse(reply.shipJson));
        fetchedShip();
    });
}


function addPlayerToQueue(player) {
    'use strict';
    playersWaiting.push(player);
    if (playersWaiting.length >= 2) {
        createBattle(playersWaiting.slice(0, 2));
        playersWaiting = playersWaiting.slice(2);
    }
}

exports.addPlayerToQueue = addPlayerToQueue;

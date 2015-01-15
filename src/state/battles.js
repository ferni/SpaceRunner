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
    players = require('./players'),
    _ = require('underscore')._,
    join = require('bluebird').join;

var playersWaitingByTier = {},
    battleServers = [];

function createBattle(players) {
    'use strict';
    var ship1,
        ship2,
        battleServer,
        U = sh.Unit;
    join(prebuiltShips.get(players[0].hullID),
        prebuiltShips.get(players[1].hullID))
        .then(function(ships) {
            var shipJsons = _.map(ships, function(s) {
                    return JSON.parse(s.shipJson);
                });
            battleServer = new BattleServer({
                id: battleServers.length,
                shipJsons: shipJsons
            });
            ship1 = battleServer.battleModel.ships[0];
            ship1.owner = players[0];
            players[0].battleID = battleServer.id;
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));

            ship2 = battleServer.battleModel.ships[1];
            ship2.owner = players[1];
            players[1].battleID = battleServer.id;
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));

            battleServers.push(battleServer);
            battleServer.nextTurn();
            players[0].state = 'inBattle';
            players[1].state = 'inBattle';
        });
}


function addPlayerToQueue(player) {
    'use strict';
    prebuiltShips.getTier(player.hullID).then(function(tier) {
        var waiting;
        if (!playersWaitingByTier[tier]) {
            playersWaitingByTier[tier] = [];
        }
        waiting = playersWaitingByTier[tier];
        waiting.push(player);
        player.state = 'finding';
        if (waiting.length >= 2) {
            createBattle(waiting.slice(0, 2));
            playersWaitingByTier[tier] = waiting.slice(2);
        }
    });
}

function removeFromQueue(player) {
    'use strict';
    _.each(playersWaitingByTier, function(players) {
        sh.utils.removeFromArray(player, players);
    });
    player.state = 'idle';
}

function get(id) {
    'use strict';
    return _.find(battleServers, function(bs) {
        return bs.id === id;
    });
}

exports.addPlayerToQueue = addPlayerToQueue;
exports.removeFromQueue = removeFromQueue;
exports.get = get;

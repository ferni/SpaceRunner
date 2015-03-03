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

var queueEntriesByTier = {},
    battleServers = [];

function createBattle(queueEntries) {
    'use strict';
    var battleServer,
        U = sh.Unit;
    return join(
        prebuiltShips.get(queueEntries[0].hullID),
        prebuiltShips.get(queueEntries[1].hullID),
        players.playerByID(queueEntries[0].playerID),
        players.playerByID(queueEntries[1].playerID)
    )
        .then(function(stuff) {
            var ship1 = stuff[0],
                ship2 = stuff[1],
                p1 = stuff[2],
                p2 = stuff[3];
            battleServer = new BattleServer({
                id: battleServers.length,
                shipJsons: [
                    JSON.parse(ship1.shipJson),
                    JSON.parse(ship2.shipJson)
                ]
            });
            ship1 = battleServer.battleModel.ships[0];
            ship1.owner = p1;
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));

            ship2 = battleServer.battleModel.ships[1];
            ship2.owner = p2;
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));

            battleServers.push(battleServer);
            battleServer.nextTurn();
        });
}


function addPlayerToQueue(player, hullID) {
    'use strict';
    return prebuiltShips.getTier(hullID).then(function(stuff) {
        var waiting,
            tier = stuff[0];
        if (!queueEntriesByTier[tier]) {
            queueEntriesByTier[tier] = [];
        }
        waiting = queueEntriesByTier[tier];
        waiting.push({playerID: player.id, hullID: hullID});
        if (waiting.length >= 2) {
            return createBattle(waiting.slice(0, 2)).then(function() {
                queueEntriesByTier[tier] = waiting.slice(2);
            });
        }
    });
}

function removeFromQueue(player) {
    'use strict';
    _.each(queueEntriesByTier, function(entries) {
        var entry = _.find(function(entry) {
            return entry.playerID === player.id;
        });
        if (entry) {
            entries.splice(_.indexOf(entries, entry), 1);
        }
    });
}

function get(id) {
    'use strict';
    id = parseInt(id, 10);
    return _.find(battleServers, function(bs) {
        return bs.id === id;
    });
}

function getFor(user) {
    'use strict';
    return _.find(battleServers, function(bs) {
        return bs.isPlayerInIt(user.id);
    });
}

function isUserFinding(user) {
    'use strict';
    return _.chain(queueEntriesByTier)
        .values().flatten().any(function(entry) {
            return entry.playerID === user.id;
        }).value();
}

function finish(battleServer) {
    'use strict';
    sh.utils.removeFromArray(battleServer, battleServers);
}

exports.addPlayerToQueue = addPlayerToQueue;
exports.removeFromQueue = removeFromQueue;
exports.get = get;
exports.getFor = getFor;
exports.finish = finish;
exports.isUserFinding = isUserFinding;
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
    join = require('bluebird').join,
    openSockets = require('./open-sockets');

var queueEntriesByTier = {},
    battleServers = [];

function createBattle(queueEntries) {
    'use strict';
    var battleServer,
        U = sh.Unit;
    return join(
        prebuiltShips.get(queueEntries[0].hullID),
        prebuiltShips.get(queueEntries[1].hullID)
    )
        .then(function(stuff) {
            var ship1 = stuff[0],
                ship2 = stuff[1],
                p1ID = queueEntries[0].playerID,
                p2ID = queueEntries[1].playerID;
            battleServer = new BattleServer({
                id: battleServers.length,
                shipJsons: [
                    JSON.parse(ship1.shipJson),
                    JSON.parse(ship2.shipJson)
                ]
            });
            ship1 = battleServer.battleModel.ships[0];
            ship1.ownerID = p1ID;
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 6, speed: 2}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));
            ship1.putUnit(new U({imgIndex: 0, speed: 1.5}));

            ship2 = battleServer.battleModel.ships[1];
            ship2.ownerID = p2ID;
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 7, speed: 1.5}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));
            ship2.putUnit(new U({imgIndex: 12, speed: 2}));

            battleServers.push(battleServer);
            battleServer.nextTurn();
            //notify players
            openSockets.sendTo(p1ID, 'match found');
            openSockets.sendTo(p2ID, 'match found');
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
    var i;
    _.each(queueEntriesByTier, function(entries) {
        if (entries.length === 0) {
            return;
        }
        for (i = 0; i < entries.length; i++) {
            if (entries[i].playerID === player.id) {
                entries.splice(i, 1);
                i--;
            }
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
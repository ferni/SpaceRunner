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
            ship,
            battle;
        if (player) {
            ship = new sh.Ship({jsonString: '{"tmxName":"Mechanoid_Cruiser",' +
                '"buildings":[{"type":"door","x":14,"y":11,"r":true},' +
                '{"type":"wall","x":14,"y":8,"r":false},' +
                '{"type":"wall","x":17,"y":8,"r":false},' +
                '{"type":"door","x":15,"y":8,"r":false},' +
                '{"type":"wall","x":14,"y":15,"r":false},' +
                '{"type":"wall","x":17,"y":15,"r":false},' +
                '{"type":"door","x":15,"y":15,"r":false},' +
                '{"type":"engine","x":10,"y":5,"r":false},' +
                '{"type":"engine","x":10,"y":17,"r":false},' +
                '{"type":"engine","x":11,"y":11,"r":false},' +
                '{"type":"console","x":11,"y":10,"r":false},' +
                '{"type":"weapon","x":24,"y":8,"r":false},' +
                '{"type":"weapon","x":24,"y":14,"r":false},' +
                '{"type":"weapon","x":20,"y":17,"r":false},' +
                '{"type":"component","x":10,"y":7,"r":false},' +
                '{"type":"component","x":10,"y":15,"r":false},' +
                '{"type":"console","x":12,"y":5,"r":false},' +
                '{"type":"console","x":12,"y":18,"r":false},' +
                '{"type":"weapon","x":20,"y":5,"r":false},' +
                '{"type":"power","x":20,"y":15,"r":false},' +
                '{"type":"power","x":20,"y":7,"r":false},' +
                '{"type":"console","x":25,"y":10,"r":false},' +
                '{"type":"console","x":25,"y":13,"r":false},' +
                '{"type":"console","x":19,"y":18,"r":false},' +
                '{"type":"console","x":19,"y":5,"r":false},' +
                '{"type":"door","x":22,"y":11,"r":true},' +
                '{"type":"weak_spot","x":15,"y":6,"r":false},' +
                '{"type":"weak_spot","x":15,"y":16,"r":false},' +
                '{"type":"weak_spot","x":19,"y":11,"r":false},' +
                '{"type":"door","x":18,"y":11,"r":true}],' +
                '"units":[]}'});
            ship.putUnit({owner: player});
            ship.putUnit({owner: player});
            ship.putUnit({owner: player});
            battle = new model.Battle({id: battles.length, ship: ship});
            battle.playerLeft = player;
            battle.playerRight = new model.AIPlayer('Enemy');
            ship.putUnit({owner: battle.playerRight, type: 5});
            ship.putUnit({owner: battle.playerRight, type: 5});
            ship.putUnit({owner: battle.playerRight, type: 5});
            ship.putUnit({owner: battle.playerRight, type: 5});
            ship.putUnit({owner: battle.playerRight, type: 5});
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

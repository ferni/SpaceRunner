/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global require, exports, battles*/

var BattleServer = require('./battle').BattleServer,
    AIPlayer = require('./ai-player').AIPlayer,
    sh = require('../public/js/shared'),
    _ = require('underscore')._;

/**
 * A battle for the "Challenge" menu option.
 * @type {*}
 */
exports.ChallengeBattle = BattleServer.extend({
    init: function(params) {
        'use strict';
        var ship = new sh.Ship({json: params.shipJson}),
            Zealot = sh.units.Zealot;
        this.parent({id: params.id, ship: ship});
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        this.tempSurrogate.players = [params.player, new AIPlayer('Enemy')];
    },
    nextTurn: function() {
        'use strict';
        var aiPlayer = this.tempSurrogate.players[1];
        this.parent();
        //register AI player orders
        this.currentTurn.addOrders(aiPlayer.getOrders(this.tempSurrogate),
            aiPlayer.id);
        this.currentTurn.setPlayerReady(aiPlayer.id);
        this.registerScriptReceived(aiPlayer.id);
    },
    generateScript: function() {
        'use strict';
        var i, clearTiles = [], summonPosition, script,
            newActions = [],
            battle = this.tempSurrogate,
            ship = battle.ships[0];
        this.parent(false);
        script = this.currentTurn.script;
        //every 3 turns...
        if ((this.turnCount - 1) % 3 === 0) {
            //...add units for AI player
            ship.map.tiles(function(x, y) {
                if (ship.map.at(x, y) === sh.tiles.clear ||
                        ship.map.at(x, y) instanceof sh.Unit) {
                    clearTiles.push({x: x, y: y});
                }
            });
            //get random floor tile
            summonPosition = clearTiles[_.random(clearTiles.length - 1)];
            for (i = 0; i < 3; i++) {
                //noinspection JSValidateTypes
                newActions.push(new sh.actions.Summon({
                    time: script.turnDuration - 1,
                    x: summonPosition.x,
                    y: summonPosition.y,
                    playerID: battle.players[1].id,
                    unitType: i === 2 ? 'MetalSpider' : 'Critter'
                }));
            }
        }
        if (ship.hp <= 0) {
            //ship is destroyed
            newActions.push(new sh.actions.DeclareWinner({
                time: script.turnDuration - 1,
                playerID: battle.players[1].id
            }));
        } else if (ship.enemyHP <= 0) {
            //enemy is destroyed!
            newActions.push(new sh.actions.DeclareWinner({
                time: script.turnDuration - 1,
                playerID: battle.players[0].id
            }));
        }

        //workaround until summon gets converted to teleport
        _.each(newActions, script.insertAction, script);
        _.each(newActions, function(a) {
            var actionIndex = _.indexOf(script.actions, a);
            _.each(a.modelChanges, function(mc, index) {
                mc.apply(battle);
                mc.actionIndex = actionIndex;
                mc.index = index;
                script.registerChange(mc);
            });
        });

        battle.endOfTurnReset();
    }
});


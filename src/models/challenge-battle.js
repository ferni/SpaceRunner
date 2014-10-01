/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global require, exports, battles*/

var BattleServer = require('./battle-server').BattleServer,
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
            Zealot = sh.units.Zealot,
            enemyShip;
        this.parent({id: params.id, ship: ship});
        ship.owner = params.player;
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));
        ship.putUnit(new Zealot({ownerID: params.player.id}));

        enemyShip = this.tempSurrogate.ships[1];
        enemyShip.owner = new AIPlayer('Enemy');
        enemyShip.putUnit(new sh.units.Critter({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.Critter({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.Critter({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.Critter({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.Critter({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.Critter({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.MetalSpider({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.MetalSpider({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.MetalSpider({ownerID: enemyShip.owner.id}));
        enemyShip.putUnit(new sh.units.MetalSpider({ownerID: enemyShip.owner.id}));
    },
    nextTurn: function() {
        'use strict';
        var self = this,
            aiPlayer = this.tempSurrogate.ships[1].owner,
            aiOrders;
        this.parent();
        //register AI player orders
        aiOrders = aiPlayer.getOrders(this.tempSurrogate);
        _.each(aiOrders, function(orders, unitID) {
            self.currentTurn.addOrders(orders, unitID, aiPlayer.id);
        });

        this.currentTurn.setPlayerReady(aiPlayer.id);
        this.registerScriptReceived(aiPlayer.id);
    }
});


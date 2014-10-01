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
        var ship, u, enemyShip;
        this.parent(params);
        u = sh.units;

        ship = this.battleModel.ships[0];
        ship.owner = params.player;
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());

        enemyShip = this.battleModel.ships[1];
        enemyShip.owner = new AIPlayer('Enemy');
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.MetalSpider());
        enemyShip.putUnit(new u.MetalSpider());
        enemyShip.putUnit(new u.MetalSpider());
        enemyShip.putUnit(new u.MetalSpider());
    },
    nextTurn: function() {
        'use strict';
        var self = this,
            aiPlayer = this.battleModel.ships[1].owner,
            aiOrders;
        this.parent();
        //register AI player orders
        aiOrders = aiPlayer.getOrders(this.battleModel);
        _.each(aiOrders, function(orders, unitID) {
            self.currentTurn.addOrders(orders, unitID, aiPlayer.id);
        });

        this.currentTurn.setPlayerReady(aiPlayer.id);
        this.registerScriptReceived(aiPlayer.id);
    }
});


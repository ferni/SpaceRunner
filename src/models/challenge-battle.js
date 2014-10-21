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
        this.aiPlayer = new AIPlayer('Enemy', this);
        u = sh.units;

        ship = this.battleModel.ships[0];
        ship.owner = params.player;
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());
        ship.putUnit(new u.Zealot());


        enemyShip = this.battleModel.ships[1];
        enemyShip.owner = this.aiPlayer;
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.MetalSpider());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.MetalSpider());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.MetalSpider());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        enemyShip.putUnit(new u.Critter());
        this.aiPlayer.prepareForBattle();
    },
    nextTurn: function() {
        'use strict';
        var self = this,
            aiOrders;
        this.parent();
        //register AI player orders
        aiOrders = this.aiPlayer.getOrders();
        _.each(aiOrders.allUnitOrders, function(unitOrders) {
            self.currentTurn.addOrders(unitOrders, self.aiPlayer.id);
        });

        this.currentTurn.setPlayerReady(this.aiPlayer.id);
        this.registerScriptReceived(this.aiPlayer.id);
    }
});


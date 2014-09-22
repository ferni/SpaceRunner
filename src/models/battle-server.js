/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global require, exports, battles*/

var Class = require('./class'),
    sh = require('../public/js/shared'),
    _ = require('underscore')._;

function BattleTurn(params) {
    'use strict';
    var self = this;
    this.id = params.id;
    this.battle = params.battle;
    this.playersOrders = {};
    this.battle.tempSurrogate.getPlayers().forEach(function(player) {
        self.playersOrders[player.id] = new sh.OrderCollection();
    });
    //all the players ids that have submitted the orders
    this.playersSubmitted = [];
    this.script = null;
    this.addOrders = function(orders, unitID, playerID) {
        var self = this;
        if (!this.battle.isPlayerInIt(playerID)) {
            throw 'Player ' + playerID + ' is not in the battle.';
        }
        self.playersOrders[playerID].addUnitOrders(orders, unitID);
    };
    this.isPlayerReady = function(playerID) {
        return _.any(this.playersSubmitted, function(id) {
            return id === playerID;
        });
    };
    this.setPlayerReady = function(playerID) {
        this.playersSubmitted.push(playerID);
    };
}

/**
 * Manages a battle, server-side.
 * @param {{id:int}} parameters
 * @constructor
 */
exports.BattleServer = Class.extend({
    numberOfPlayers: 2,
    turnCount: 0,
    currentTurn: null,
    receivedTheScript: [], //players ids that received the script
    winner: null,
    init: function(parameters) {
        'use strict';
        var enemyShip = new sh.Ship({tmxName: 'humanoid_cruiser'});
        enemyShip.hp = 300;
        this.id = parameters.id;
        this.tempSurrogate = new sh.Battle({
            id: this.id,
            turnDuration: 4000
        });
        this.tempSurrogate.addShip(parameters.ship);
        this.tempSurrogate.addShip(enemyShip);
    },
    /**
     * Informs that some player has received the script.
     * When all players in the battle receive the script,
     * a new turn is created.
     * @param {int} playerID The player ID.
     * @return {boolean} If the next turn was created or not.
     * @this exports.BattleServer
     */
    registerScriptReceived: function(playerID) {
        'use strict';
        this.receivedTheScript.push(playerID);
        if (_.uniq(this.receivedTheScript).length >= this.numberOfPlayers) {
            //all players have received the script, create next turn
            this.nextTurn();
            return true;
        }
        return false;
    },
    nextTurn: function() {
        'use strict';
        this.turnCount++;
        this.currentTurn = new BattleTurn({id: this.turnCount, battle: this});
        this.receivedTheScript = [];

    },
    isPlayerInIt: function(playerID) {
        'use strict';
        return _.any(this.tempSurrogate.getPlayers(), function(player) {
            return player.id === playerID;
        });
    },
    generateScript: function(resetShip) {
        'use strict';
        var turn = this.currentTurn,
            orders = new sh.OrderCollection(),
            battle = this.tempSurrogate;
        _.each(turn.playersOrders, function(playerOrders) {
            orders.addCollection(playerOrders);
        });
        if (resetShip === undefined) {
            resetShip = true;
        }
        turn.script = sh.createScript(orders, battle, resetShip);
    }
});

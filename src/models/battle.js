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
    this.id = params.id;
    this.battle = params.battle;
    this.playersOrders = {};
    this.playersOrders[this.battle.playerLeft.id] = {};
    this.playersOrders[this.battle.playerRight.id] = {};
    //all the players ids that have submitted the orders
    this.playersSubmitted = [];
    this.script = null;
    this.addOrders = function(orders, playerID) {
        var self = this;
        if (!this.battle.isPlayerInIt(playerID)) {
            throw 'Player ' + playerID + ' is not in the battle.';
        }
        _.each(orders, function(unitOrders, unitID) {
            self.playersOrders[playerID][unitID] = unitOrders;
        });
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
 * A model representing a battle.
 * @param {{id,ship}} parameters
 * @constructor
 */
exports.Battle = Class.extend({
    //The players currently in this battle
    playerLeft: null,
    playerRight: null,
    numberOfPlayers: 2,
    turnCount: 0,
    currentTurn: null,
    receivedTheScript: [], //players ids that received the script
    turnDuration: 4000,
    winner: null,
    init: function(parameters) {
        'use strict';
        this.id = parameters.id;
        this.tempSurrogate = new sh.Battle({
            id: this.id,
            turnDuration: this.turnDuration
        });
        this.tempSurrogate.addShip(parameters.ship);
    },
    /**
     * Informs that some player has received the script.
     * When all players in the battle receive the script,
     * a new turn is created.
     * @param {int} playerID The player ID.
     * @return {boolean} If the next turn was created or not.
     * @this exports.Battle
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
        return (this.playerLeft && this.playerLeft.id === playerID) ||
            (this.playerRight && this.playerRight.id === playerID);
    },
    generateScript: function(resetShip) {
        'use strict';
        var turn = this.currentTurn,
            orders = _.extend(turn.playersOrders[this.playerLeft.id],
                turn.playersOrders[this.playerRight.id]),
            battle = this.tempSurrogate;
        if (resetShip === undefined) {
            resetShip = true;
        }
        console.log('all orders' + JSON.stringify(orders));
        turn.script = sh.createScript(orders, battle, this.turnDuration,
            resetShip);
    }
});

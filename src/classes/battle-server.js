/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/

var Class = require('./class'),
    sh = require('shared'),
    _ = require('underscore')._,
    battles = require('../state/battles');

function BattleTurn(params) {
    'use strict';
    var self = this;
    this.id = params.id;
    this.battle = params.battle;
    this.playersOrders = {};
    this.battle.battleModel.getPlayers().forEach(function(playerID) {
        self.playersOrders[playerID] = new sh.OrderCollection();
    });
    //all the players ids that have submitted the orders
    this.playersSubmitted = [];
    this.script = null;
    this.addOrders = function(unitOrders, playerID) {
        if (!this.battle.isPlayerInIt(playerID)) {
            throw 'Player ' + playerID + ' is not in the battle.';
        }
        self.playersOrders[playerID].addUnitOrders(unitOrders);
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
var BattleServer = Class.extend({
    numberOfPlayers: 2,
    turnCount: 0,
    currentTurn: null,
    receivedTheScript: [], //players ids that received the script
    winner: null,
    init: function(parameters) {
        'use strict';
        var battle;
        this.id = parameters.id;
        battle = new sh.Battle({
            id: this.id,
            turnDuration: 4000
        });
        _.each(parameters.shipJsons, function(json) {
            battle.addShip(new sh.Ship({json: json}));
        });
        this.battleModel = battle;
    },
    /**
     * Informs that some player has received the script.
     * When all players in the battle receive the script,
     * a new turn is created.
     * @param {int} playerID The player ID.
     * @this exports.BattleServer
     */
    registerScriptReceived: function(playerID) {
        'use strict';
        this.receivedTheScript.push(playerID);
        if (_.uniq(this.receivedTheScript).length >= this.numberOfPlayers) {
            //all players have received the script, create next turn
            if (this.battleModel.winner !== undefined) {
                battles.finish(this);
            } else {
                this.nextTurn();
            }
        }
    },
    nextTurn: function() {
        'use strict';
        this.turnCount++;
        this.currentTurn = new BattleTurn({id: this.turnCount, battle: this});
        this.receivedTheScript = [];

    },
    isPlayerInIt: function(playerID) {
        'use strict';
        return _.any(this.battleModel.getPlayers(), function(id) {
            return id === playerID;
        });
    },
    generateScript: function(resetShip) {
        'use strict';
        var turn = this.currentTurn,
            orderCollection = new sh.OrderCollection(),
            battle = this.battleModel;
        _.each(turn.playersOrders, function(playerOrders) {
            orderCollection.merge(playerOrders);
        });
        if (resetShip === undefined) {
            resetShip = true;
        }
        turn.script = sh.createScript(orderCollection, battle, resetShip);
    },
    getOpponent: function(playerID) {
        'use strict';
        return _.find(this.battleModel.getPlayers(), function(id) {
            return id !== playerID;
        });
    },
    surrender: function(playerID) {
        'use strict';
        if (!this.isPlayerInIt(playerID)) {
            throw new Error('Can\'t surrender: Player is not in the battle.');
        }
        this.battleModel.winner = this.getOpponent(playerID);
        battles.finish(this);
    }
});

module.exports = BattleServer;

//for playing against AI
/*
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
}*/

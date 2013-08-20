/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var Class = require('./class'),
    sh = require('./public/js/shared'),
    auth = require('./auth'),
    _ = require('underscore')._;


function BattleTurn(params) {
    this.id = params.id;
    this.battle = params.battle;
    this.playersOrders = {};
    //all the players ids that have submitted the orders
    this.playersSubmitted = [];
    this.script = null;
    this.addOrders = function(orders, playerID) {
        var self = this;
        if(!this.playersOrders[playerID]) {
            this.playersOrders[playerID] = {};
        }
        _.each(orders, function(order){
            self.playersOrders[playerID][order.unitID] = order;
        });
    };
    this.setPlayerReady = function(playerID){
        if(_.any(this.playersSubmitted, function(ps){
            return ps === playerID;
        })) {
            console.error('Orders for player ' + playerID +
                ' had already been added.');
            throw 'Orders for player ' + playerID +
                ' had already been added.';
        }
        this.playersSubmitted.push(playerID);
    };
    this.generateScript = function(){
        var orders = _.extend(this.playersOrders[this.battle.playerLeft.id],
                              this.playersOrders[this.battle.playerRight.id]);
        
        console.log('playerLeft\'s orders:' + JSON.stringify(this.playersOrders[this.battle.playerLeft.id]));
        console.log('playerRight\'s orders:' + JSON.stringify(this.playersOrders[this.battle.playerRight.id]));
        console.log('all orders' + JSON.stringify(orders));
        this.script = sh.createScript(orders, this.battle.ship,
            this.battle.turnDuration);
    };
}

exports.Battle = function(parameters) {
    this.id = parameters.id;
    this.ship = parameters.ship;
    //The players currently in this battle
    this.playerLeft = null;
    this.playerRight = null;
    this.numberOfPlayers = 2;
    this.turnCount = 0;
    this.currentTurn = null;

    this.receivedTheScript = []; //players ids that received the script
    this.turnDuration = 3000;
    /**
     * Informs that some player has received the script.
     * When all players in the battle receive the script,
     * a new turn is created.
     * @param playerID {int} The player ID.
     * @returns {boolean} If the next turn was created or not.
     */
    this.registerScriptReceived = function(playerID){
        this.receivedTheScript.push(playerID);
        if(_.uniq(this.receivedTheScript).length >= this.numberOfPlayers) {
            //all players have received the script, create next turn
            this.nextTurn();
            return true;
        }
        return false;
    };
    this.nextTurn = function(){
        this.turnCount++;
        this.currentTurn = new BattleTurn({id: this.turnCount, battle: this});
        this.receivedTheScript = [];
    };
    this.isPlayerInIt = function(playerID) {
        return (this.playerLeft && this.playerLeft.id === playerID) ||
            (this.playerRight && this.playerRight.id === playerID);
    };
    this.toJson = function(){
        return {
            id: this.id,
            ship: this.ship.toJsonString(),
            playerLeft: this.playerLeft.toJson(),
            playerRight: this.playerRight.toJson()
        };
    };
    //create first turn
    this.nextTurn();

};

exports.BattleSetUp = function(params) {
    this.id = params.id;
    this.creator = params.creator;
    this.shipJsonString = params.shipJsonString;
    this.challenger = null; //player that joins
    this.battle = null;
    this.toJson = function(){
        return {
            id: this.id,
            battle: this.battle ?
                this.battle.toJson() : null,
            creator: this.creator ?
                this.creator.toJson() : {name: '<empty>'},
            challenger: this.challenger ?
                this.challenger.toJson() : {name: '<empty>'}
        }
    };
    this.isFull = function() {
        return this.challenger && this.creator;
    };
    this.addPlayer = function(player){
        if(!this.isFull()){
            this.challenger = player;
        } else{
            throw 'Cannot add player, battle is full';
        }
    };
    this.updatePlayers = function(){
        if(this.creator && !auth.isOnline(this.creator.id)) {
            this.creator = null;
        }
        if(this.challenger && !auth.isOnline(this.challenger.id)) {
            this.challenger = null;
        }
    };
    /**
     * Returns the battle.
     */
    this.createBattle = function(done){
        var err = null;
        try{
            var ship = new sh.Ship({jsonString: this.shipJsonString}),
                battle = new exports.Battle({id: battles.length, ship: ship});
            ship.putUnit({type: 0, speed: 0.5, owner: this.creator});
            ship.putUnit({type: 0, speed: 0.5, owner: this.creator});
            ship.putUnit({type: 6, speed: 2, owner: this.creator});
            ship.putUnit({type: 6, speed: 2, owner: this.creator});

            ship.putUnit({type: 7, speed: 0.5, owner: this.challenger});
            ship.putUnit({type: 7, speed: 0.5, owner: this.challenger});
            ship.putUnit({type: 12, speed: 2, owner: this.challenger});
            ship.putUnit({type: 12, speed: 2, owner: this.challenger});
            battle.playerLeft = this.creator;
            battle.playerRight = this.challenger;
            battles.push(battle);
            this.battle = battle;
        }
        catch(e){
            err = new Error(e);
        }
        done(err);
    };
};


exports.Player = sh.Player.extendShared({
});


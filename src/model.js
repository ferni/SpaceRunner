/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var Class = require('./class'),
    sh = require('./public/js/shared'),
    auth = require('./auth'),
    _ = require('underscore');


function BattleTurn(params) {
    this.id = params.id;
    this.battle = params.battle;
    this.allOrders = [];
    //all the players ids that have submitted the orders
    this.playersSubmitted = [];
    this.script = null;
    this.addOrders = function(playerID, orders){
        if(_.any(this.playersSubmitted, function(ps){
            return ps === playerID;
        })) {
            console.error('Orders for player ' + playerID +
                ' had already been added.')
            throw 'Orders for player ' + playerID +
                ' had already been added.';
        }

        this.allOrders = this.allOrders.concat(orders);
        this.playersSubmitted.push(playerID);
        if(this.playersSubmitted.length == this.battle.numberOfPlayers &&
            !this.script) {
            //all orders have been submitted, generate the script
            this.generateScript();
        }
    };
    this.generateScript = function(){
        this.script = {};
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
            ship.putUnit({type: 0, speed: 2, owner: this.creator});
            ship.putUnit({type: 0, speed: 2, owner: this.creator});
            ship.putUnit({type: 6, speed: 3, owner: this.creator});
            ship.putUnit({type: 6, speed: 3, owner: this.creator});

            ship.putUnit({type: 7, speed: 2, owner: this.challenger});
            ship.putUnit({type: 7, speed: 2, owner: this.challenger});
            ship.putUnit({type: 12, speed: 3, owner: this.challenger});
            ship.putUnit({type: 12, speed: 3, owner: this.challenger});
            battle.playerLeft = this.creator;
            battle.playerRight = this.challenger;
            battles.push(battle);
            this.battle = battle;
            return battle;
        }
        catch(e){
            err = new Error(e);
        }
        done(err);
    };
};


exports.Player = sh.Player.extendShared({
});


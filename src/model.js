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

exports.Battle = function(parameters) {
    this.id = parameters.id;
    this.ship = parameters.ship;
    //The players currently in this battle
    this.playerLeft = null;
    this.playerRight = null;
    this.toJson = function(){
        return {
            id: this.id,
            ship: this.ship.toJsonString(),
            playerLeft: this.playerLeft.toJson(),
            playerRight: this.playerRight.toJson()
        };
    }

};

exports.BattleSetUp = function(params) {
    this.id = params.id;
    this.creator = params.creator;//the player id
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

exports.Building = Class.extend({
    init: function(x, y){

    },
    toJson: function(){
        return {
            type: 'Building'
        }
    }
});



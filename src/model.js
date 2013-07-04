/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var Extendable = require('./extendable').Extendable,
    shared = require('./public/js/shared'),
    auth = require('./auth');


exports.Battle = function(parameters) {
    var id = parameters.id;
    var shipJsonString = parameters.shipJsonString;
    this.id = id;
    this.shipJsonString = shipJsonString;
    //The ids of the players currently in this battle
    this.playerLeft = null;
    this.playerRight = null;


};

exports.BattleSetUp = function(params) {
    this.id = params.id;
    this.creator = params.creator;//the player id
    this.shipJsonString = params.shipJsonString;
    this.challenger = null; //player that joins
    this.battleID = null;
    this.toJson = function(){
        return {
            id: this.id,
            battleID: this.battleID,
            creator: this.creator ?
                shared.pack(this.creator) :
                {name: '<empty>'},
            challenger: this.challenger ?
                shared.pack(this.challenger) :
                {name: '<empty>'}
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
    this.createBattle = function(){
        var battle = new exports.Battle({id: battles.length,
            shipJsonString: this.shipJsonString});
        battle.playerLeft = this.creator.id;
        battles.push(battle);
        return battle;
    };
};


exports.Player = shared.Player.extendShared({
});



exports.Ship = Extendable.extend({
    init: function(tmxName) {
        this.tmxName = tmxName;
    }
});


/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var Extendable = require('./extendable').Extendable;


exports.BattleSetUp = function(params) {
    this.id = params.id;
    this.creator = params.creator;//the player id
    this.shipJsonString = params.shipJsonString;
    this.challenger = null; //player that joins
};

exports.Battle = function(parameters) {
    var id = parameters.id;
    var shipJsonString = parameters.shipJsonString;
    this.id = id;
    this.shipJsonString = shipJsonString;
    //The ids of the players currently in this battle
    this.playerLeft = null;
    this.playerRight = null;
    this.isFull = function() {
        return this.playerLeft !== null
            && this.playerRight !== null;
    };
    this.addPlayer = function(playerID){
        if(this.playerLeft === null) {
            this.playerLeft = playerID;
        } else if(this.playerRight === null) {
            this.playerRight = playerID;
        } else{
            throw 'Cannot add player, battle is full';
        }
    };
    this.jsonForLobby = function(){
        return {
            id: this.id,
            playerLeft: this.playerLeft,
            playerRight: this.playerRight !== null ?
                exports.playerByID(this.playerRight).name :
                null
        }
    };
};

exports.Player = function(params) {
    this.id = params.id;
    this.name = params.name;
};



exports.Ship = Extendable.extend({
    init: function(tmxName) {
        this.tmxName = tmxName;
    }
});


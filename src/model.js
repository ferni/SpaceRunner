/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var _ = require('underscore')._,
    Extendable = require('./extendable').Extendable;


exports.playerByID = function(id) {
    return _.find(currentPlayers, function(p){
        return p.id == id;
    });
}

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
}

exports.Player = function(params) {
    this.id = params.id;
    this.name = params.name;
}

exports.toUniqueName = function(playerName) {
    var newName = playerName,
        number = 1;
    while(_.any(currentPlayers, function(p){
        return p.name === newName;
    })) {
        newName = playerName + number.toString();
        number++;
    }
    return newName;
}

exports.createNewPlayer = function() {
    var player = new exports.Player({
        id: currentPlayers.length,
        name: exports.toUniqueName('Player')
    });
    return player;
}

exports.Ship = Extendable.extend({
    init: function(tmxName) {
        this.tmxName = tmxName;
    }
});


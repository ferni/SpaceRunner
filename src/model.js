/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var Extendable = require('./extendable').Extendable,
    shared = require('./public/js/shared');


exports.BattleSetUp = function(params) {
    this.id = params.id;
    this.creator = params.creator;//the player id
    this.shipJsonString = params.shipJsonString;
    this.challenger = null; //player that joins
    this.toJson = function(){
        return {
            id: this.id,
            creator: shared.pack(this.creator),
            challenger: shared.pack(this.challenger)
        }
    };
    this.isFull = function() {
        return this.challenger !== null;
    };
    this.addPlayer = function(player){
        if(!this.isFull()){
            this.challenger = player;
        } else{
            throw 'Cannot add player, battle is full';
        }
    };
};

exports.Battle = function(parameters) {
    var id = parameters.id;
    var shipJsonString = parameters.shipJsonString;
    this.id = id;
    this.shipJsonString = shipJsonString;
    //The ids of the players currently in this battle
    this.playerLeft = null;
    this.playerRight = null;


};

exports.Player = shared.Player.extendShared({
});



exports.Ship = Extendable.extend({
    init: function(tmxName) {
        this.tmxName = tmxName;
    }
});


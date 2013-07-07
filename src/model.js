/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var Extendable = require('./extendable').Extendable,
    sh = require('./public/js/shared'),
    auth = require('./auth'),
    _ = require('underscore');

exports.Ship = Extendable.extend({
    init: function(jsonString) {
        this.buildings = [];
        this.units = [];
        this.fromJsonString(jsonString);
    },
    addBuilding: function(building){
        this.buildings.push(building);
    },
    addUnit: function(unit) {
        this.units.push(unit);
    },
    toJsonString: function() {
        return JSON.stringify({
            'tmxName': this.tmxName,
            'buildings': this.buildings,
            'units': this.units
        });
    },
    fromJsonString: function(jsonString) {
        var json,
            ship = this;
        //ship.removeAll();
        json = JSON.parse(jsonString);
        this.tmxName = json.tmxName.toLowerCase();
        this.loadMap();
        _.each(json.buildings, function(b){
            ship.addBuilding(b);
        });
        _.each(json.units, function(u){
            ship.addUnit(u);
        });
    },
    loadMap : function(){
        var map = shipMaps[this.tmxName];
        if(typeof map === 'undefined') {
            throw new Error('tmx not found: '+ this.tmxName);
        }
        this.hullMap = map.hull;
        this.width = map.width;
        this.height = map.height;
    }
});

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
        }
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
    this.createBattle = function(){
        var ship = new exports.Ship(this.shipJsonString),
            battle = new exports.Battle({id: battles.length, ship: ship});
        battle.playerLeft = this.creator;
        battle.playerRight = this.challenger;
        battles.push(battle)
        this.battle = battle;
        return battle;
    };
};


exports.Player = sh.Player.extendShared({
});

exports.Building = Extendable.extend({
    init: function(x, y){

    },
    toJson: function(){
        return {
            type: 'Building'
        }
    }
});



/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var _ = require('underscore')._;

exports.Battle = function(id) {
    this.id = id;

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



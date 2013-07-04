
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

 var _ = require('underscore')._,
     model = require('./model'),
     chat = require('./chat');

 exports.getID = function(req) {
     //check that there's a player
     var id = req.session.playerID;
     if (typeof id === 'undefined') {
        throw 'Player not in session';
     }
     return id;
 };

 exports.playerByID = function(id) {
     return _.find(currentPlayers, function(p){
         return p.id == id;
     });
 };

 exports.getPlayer = function(req) {
     return exports.playerByID(exports.getID(req));
 };

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
 };

 exports.createNewPlayer = function() {
     var player = new model.Player({
         id: currentPlayers.length,
         name: exports.toUniqueName('Player')
     });
     chat.log('Player "'+ player.name +'" connected to server.');
     return player;
 };

 exports.disconnect = function(req) {
    var player = exports.getPlayer(req),
        index = currentPlayers.indexOf(player);
     currentPlayers.splice(index, 1);
     req.session.playerID = undefined;
     chat.log('Player "'+ player.name +'" has been disconnected' +
         ' from the server.');
 };

 exports.isOnline = function(playerID) {
     return _.any(currentPlayers, function(p){
         return p.id == playerID;
     });
 };

/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global me, $*/

 var server = {
     disconnect: function(){
         $.post('/general/disconnect', function(data){
         }, 'json');
     },

     createBattle: function(ship, onDone){
         console.log('Creating battle...');
         $.post('/battle-set-up/create',{shipJsonString: ship.toJsonString()},
             function(data) {
                 console.log('Battle created');
                 data.creator = sh.make.playerFromJson(data.creator);
                 onDone(data);
             }, 'json');
     },
     joinBattle: function(battleID, onDone) {
         console.log('Joining battle...');
         $.post('/battle-set-up/join', {battleID: battleID},
             function(data) {
                 if (!data.error) {
                     onDone();
                 } else {
                     console.error('Attempted to join a full battle');
                 }
             }, 'json');
     }
 };

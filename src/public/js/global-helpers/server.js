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
     }
 };

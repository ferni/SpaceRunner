/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global me, $*/

 var server = {
     joinBattle: function(battleID) {

         console.log('Joining battle...');
         $.post('/battles/join', {battleID: battleID},
             function(data) {
                 if (!data.error) {
                     me.state.change('battle',
                         {
                             battleID: battleID,
                             shipJsonString: data.shipJsonString
                         });
                 } else {
                    console.error('Attempted to join a full battle');
                 }
             }, 'json');
     }
 };

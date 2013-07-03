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
     }
 };

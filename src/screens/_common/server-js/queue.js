/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports*/
var playersWaiting = [];

exports.addPlayer = function(playerID) {
    'use strict';
    var match = [];
    playersWaiting.push(playerID);
    if (playersWaiting >= 2) {
        match.push(playersWaiting.shift());
        match.push(playersWaiting.shift());
        //todo: create battle with both this players.
    }
};

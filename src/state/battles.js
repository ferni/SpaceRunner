/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports*/
var playersWaiting = [];

exports.addPlayerToQueue = function(playerID) {
    'use strict';
    playersWaiting.push(playerID);
    if (playersWaiting >= 2) {
        //todo: create battle with both these players: [0] and [1].
    }
};


/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var GameState = function() {
    'use strict';
    //sh.Player
    this.player = null;
    //sh.Ship
    this.ship = null;
    this.modes = {
        //auto-creates battles, and auto-joins
        auto: false,
        useprebuilt: false
    };
    //selected TileEntityVMs at a given moment.
    this.selected = [];
};

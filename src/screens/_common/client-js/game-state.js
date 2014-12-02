/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module*/

var gs = module.exports = {
    //sh.Player
    player: null,
    //sh.Ship
    ship: null,
    modes: {
        //auto-creates battles, and auto-joins
        auto: false,
        useprebuilt: false
    },
    //selected TileEntityVMs at a given moment.
    selected: []
};

/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

me.plugin.patch(me.TMXTileMap, 'load', function() {
    'use strict';
    this.parent();
    this.mapLayers.push(new me.ColorLayer('background_color', '#000000',
        this.z - 10));
});

//Disable pause on blur
me.state.pause = function (){};
me.state.resume = function (){};


/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, $, items, RedColorObject, charMap*/


var WIDTH, HEIGHT, TILE_SIZE, ship, ui;
// game resources
// in the case of the items, set their image name equal to their type.
var g_resources = [{
    name: 'outline',
    type: 'image',
    src: 'data/img/render/outline.png'
}, {
    name: 'selector',
    type: 'image',
    src: 'data/img/render/selector.png'
}, {
    name: 'weapon',
    type: 'image',
    src: 'data/img/render/weapon_01.png'
}, {
    name: 'engine',
    type: 'image',
    src: 'data/img/render/engine_01.png'
}, {
    name: 'power',
    type: 'image',
    src: 'data/img/render/power_01.png'
}, {
    name: 'console',
    type: 'image',
    src: 'data/img/render/console_02.png'
}, {
    name: 'component',
    type: 'image',
    src: 'data/img/render/components_01.png'
}, {
    name: 'door',
    type: 'image',
    src: 'data/img/render/door_01.png'
}, {
    name: 'wall',
    type: 'image',
    src: 'data/img/render/wall_001.png'
}, {
    name: 'colTile',
    type: 'image',
    src: 'data/img/render/metatiles32x32.png'
}, {
    name: 'area_01',
    type: 'tmx',
    src: 'data/outlines/small.tmx'
}, {
    name: 'test',
    type: 'tmx',
    src: 'data/outlines/test.tmx'
}];

var g_resources_size = [{
    name: 'outline',
    width: 192,
    height: 256
}, {
    name: 'small',
    width: 576,
    height: 384
}];

// jsApp
var jsApp = {
    /* ---

    Initialize the jsApp

    --- */
    onload: function (shipName) {
        'use strict';
        // init the video
        if (!me.video.init('jsapp', 576, 384)) {
            alert('Sorry but your browser does not support html 5 canvas.');
            return;
        }
        // initialize the "audio"
        //        me.audio.init("mp3,ogg");
        // set all resources to be loaded
        me.loader.onload = this.loaded.bind(this, shipName);
        // set all resources to be loaded
        me.loader.preload(g_resources);
        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },
    /* ---
    callback when everything is loaded
    --- */
    loaded: function (shipName) {
        'use strict';
        var ship = new Ship(shipName);
        // set the "Play/Ingame" Screen Object
        me.state.BUILD = me.state.USER + 1;

        me.state.set(me.state.BUILD, new ShipBuildingScreen(ship));

        // start the game
        me.state.change(me.state.BUILD);
    }
};

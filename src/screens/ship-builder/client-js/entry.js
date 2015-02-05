/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, me, shipType, hullMaps*/

//sugar
var jsApp, gs, sh, ShipBuilding, assets;
gs = require('client/game-state');
sh = require('shared');
gs.TILE_SIZE = 32 / sh.GRID_SUB;
gs.HALF_TILE = 16 / sh.GRID_SUB;
ShipBuilding = require('./ship-building-screen');
assets = require('./assets');

require('client/melonjs-plugins');

jsApp = {
    loadReady: false,
    /* ---

    Initialize the jsApp

    --- */
    onload: function() {
        'use strict';
        // init the video
        //to get ship width: hullMaps[shipType].width * gs.TILE_SIZE
        if (!me.video.init('jsapp', 1440, 1344)) {
            alert('Sorry but your browser does not support html 5 canvas.');
            return;
        }
        // initialize the "audio"
        //        me.audio.init("mp3,ogg");
        // set all resources to be loaded
        me.loader.onload = this.loaded.bind(this);
        // set all resources to be loaded
        me.loader.preload(assets);
        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },
    /* ---
    callback when everything is loaded
    --- */
    loaded: function() {
        'use strict';
        var self = this;

        gs.player = new sh.Player({
            id: 777,
            name: 'hardcoded name'
        });

        //prepare dom
        $('#jsapp').bind('contextmenu', function() {
            return false;//disable context menu
        }).attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false);//disable selection

        me.state.set('ship-building', new ShipBuilding());
        me.state.change('ship-building');
        self.loadReady = true;
        self.onAppLoaded();

    },
    /*
    useful for testing
    */
    onAppLoaded: function() {
        'use strict';
        return 0;
    }
};

window.onReady(function() {
    'use strict';
    jsApp.onload();
});
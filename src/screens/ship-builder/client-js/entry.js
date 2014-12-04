/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, me*/

//sugar
var hullMaps = {},
    jsApp,
    gs = require('../../_common/client-js/game-state'),
    sh = require('../../_common/shared-js'),
    ShipBuilding = require('./ship-building-screen'),
    hullMapGenerator = require('../../_common/client-js/global-helpers/hull-map-generator'),
    assets = require('./assets');

gs.TILE_SIZE = 32 / sh.GRID_SUB;
gs.HALF_TILE = 16 / sh.GRID_SUB;

jsApp = {
    loadReady: false,
    /* ---

    Initialize the jsApp

    --- */
    onload: function() {
        'use strict';
        // init the video
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
    generateHullMaps: function() {
        'use strict';
        var i, tmxTileMap;
        window.hullMaps = {};
        for (i = 0; i < sh.mapNames.length; i++) {
            tmxTileMap = new me.TMXTileMap(sh.mapNames[i], 0, 0);
            tmxTileMap.load();
            hullMaps[sh.mapNames[i]] = hullMapGenerator.get(tmxTileMap);
        }
    },
    /* ---
    callback when everything is loaded
    --- */
    loaded: function() {
        'use strict';
        var self = this;

        this.generateHullMaps();

        gs.player = new sh.Player({
            id: 777,
            name: 'hardcoded name'
        });
        me.state.set('ship-building', new ShipBuilding());
        me.state.change('ship-building', {tmxName: 'Cyborg_Frigate'});
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
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, me, bootstrapped*/

//sugar
var jsApp, gs, sh, BattleScreen, assets;
gs = require('client/game-state');
sh = require('shared');
gs.TILE_SIZE = 32 / sh.GRID_SUB;
gs.HALF_TILE = 16 / sh.GRID_SUB;
BattleScreen = require('./battle-screen');

require('client/melonjs-plugins');
require('./knockout-custom-bindings');
require('client/chat-client').start();

jsApp = {
    loadReady: false,
    /* ---

    Initialize the jsApp

    --- */
    onload: function() {
        'use strict';
        // init the video
        if (!me.video.init('jsapp', 100, 100)) {
            alert('Sorry but your browser does not support html 5 canvas.');
            return;
        }
        // initialize the "audio"
        //        me.audio.init("mp3,ogg");
        // set all resources to be loaded
        me.loader.onload = this.loaded.bind(this);
        // set all resources to be loaded
        me.loader.preload([]);
        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },
    /* ---
    callback when everything is loaded
    --- */
    loaded: function() {
        'use strict';
        var self = this;

        gs.player = new sh.Player(bootstrapped.playerJson);
        me.state.set(1, new BattleScreen());
        me.state.change(1, new sh.Battle(bootstrapped.battleJson));
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
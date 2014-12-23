/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, me*/

//sugar
var jsApp, gs, sh, Screen, assets, utils;
gs = require('client/game-state');
sh = require('shared');
gs.TILE_SIZE = 32 / sh.GRID_SUB;
gs.HALF_TILE = 16 / sh.GRID_SUB;
Screen = require('./screen');
assets = require('./assets');
utils = require('client/utils');


jsApp = {
    loadReady: false,
    /* ---

    Initialize the jsApp

    --- */
    onload: function() {
        'use strict';
        // init the video
        var width = utils.getParameterByName('width'),
            height = utils.getParameterByName('height');
        if (!me.video.init('jsapp', width, height)) {
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
        // set screens-html
        var self = this;
        me.state.set('screen', new Screen());
        function handleParentMessage(event) {
            if (event.data.type === 'start battle') {
                gs.player = new sh.Player(event.data.playerJson);
                me.state.change('screen', new sh.Battle(event.data.battleJson),
                    event.data.shipID);
                self.loadReady = true;
                self.onAppLoaded();
            } else if (event.data.type === 'Script') {
                me.state.current().runScript(new sh.Script()
                    .fromJson(event.data));
            }
        }
        window.addEventListener('message', handleParentMessage, false);
        parent.postMessage({eventName: 'ready'}, '*');

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

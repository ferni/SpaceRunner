/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, $, sh, hullMapGenerator, GameState, gs,
chatClient, server, screens, gameResources*/

//sugar
var TILE_SIZE = 32 / sh.GRID_SUB, HALF_TILE = 16 / sh.GRID_SUB;

var prebuilt = {
    humanoid: '{"tmxName":"Humanoid_Cruiser","buildings":[' +
        '{"type":"Power","x":15,"y":11,"r":false},' +
        '{"type":"Engine","x":11,"y":9,"r":false},' +
        '{"type":"Engine","x":11,"y":13,"r":false},' +
        '{"type":"Weapon","x":22,"y":9,"r":false},' +
        '{"type":"Weapon","x":22,"y":13,"r":false},' +
        '{"type":"Component","x":19,"y":11,"r":false},' +
        '{"type":"Console","x":11,"y":11,"r":false},' +
        '{"type":"Console","x":11,"y":12,"r":false},' +
        '{"type":"Console","x":21,"y":9,"r":false},' +
        '{"type":"Console","x":21,"y":14,"r":false}],' +
        '"units":[]}'
};

var hullMaps = {},
    gs,
    FIRST_SCREEN;

// jsApp
var jsApp = {
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
        me.loader.preload(gameResources);
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
        // set screens-html
        var self = this;
        window.FIRST_SCREEN = 'lobby';

        this.generateHullMaps();
        chatClient.start();

        //prepare dom
        $('#jsapp').bind('contextmenu', function() {
            return false;//disable context menu
        }).attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false);//disable selection

        screens.loadHtmls(function() {
            server.init(function(data) {
                gs.player = new sh.Player(data.player);
                if (data.battleID !== undefined) {
                    //player was in a battle, resume it
                    server.getBattle(data.battleID, function(battleJson) {
                        me.state.change('battle', new sh.Battle(battleJson),
                            battleJson.orders);
                        self.loadReady = true;
                        self.onAppLoaded();
                    });
                } else {
                    me.state.change(FIRST_SCREEN);
                    self.loadReady = true;
                    self.onAppLoaded();
                }
            });
        });
    },
    /*
    useful for testing
    */
    onScreenReset: function() {
        'use strict';
        return 0;
    },
    onAppLoaded: function() {
        'use strict';
        return 0;
    }
};

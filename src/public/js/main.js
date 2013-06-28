/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, $, items, RedColorEntity, hullMap,
html, ShipSelectScreen, ShipBuildingScreen, BattleScreen*/

//sugar
var TILE_SIZE = 32, HALF_TILE = 16;
function width() {
    'use strict';
    if (!me.game.currentLevel.initialized) {
        throw 'Cannot get width from the current level.' +
            ' The level has not been loaded, or there is no level.';
    }
    return me.game.currentLevel.width;
}
function height() {
    'use strict';
    if (!me.game.currentLevel.initialized) {
        throw 'Cannot get height from the current level.' +
            ' The level has not been loaded, or there is no level.';
    }
    return me.game.currentLevel.height;
}

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
    name: 'metatiles32x32',
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
}, {
    name: 'cyborg_frigate',
    type: 'tmx',
    src: 'data/outlines/cyborg_frigate.tmx'
}, {
    name: 'cyborg_frigate_img',
    type: 'image',
    src: 'data/img/render/ships/cyborg/cyborg_frigate_img.png'
}, {
    name: 'cyborg_cruiser',
    type: 'tmx',
    src: 'data/outlines/cyborg_cruiser.tmx'
}, {
    name: 'cyborg_cruiser_img',
    type: 'image',
    src: 'data/img/render/ships/cyborg/cyborg_cruiser_img.png'
}, {
    name: 'cyborg_battleship1',
    type: 'tmx',
    src: 'data/outlines/cyborg_battleship1.tmx'
}, {
    name: 'cyborg_battleship1_img',
    type: 'image',
    src: 'data/img/render/ships/cyborg/cyborg_battleship1_img.png'
}, {
    name: 'cyborg_battleship2',
    type: 'tmx',
    src: 'data/outlines/cyborg_battleship2.tmx'
}, {
    name: 'cyborg_battleship2_img',
    type: 'image',
    src: 'data/img/render/ships/cyborg/cyborg_battleship2_img.png'
}, {
    name: 'cyborg_drone',
    type: 'tmx',
    src: 'data/outlines/cyborg_drone.tmx'
}, {
    name: 'cyborg_drone_img',
    type: 'image',
    src: 'data/img/render/ships/cyborg/cyborg_drone_img.png'
}, {
    name: 'humanoid_frigate',
    type: 'tmx',
    src: 'data/outlines/humanoid_frigate.tmx'
}, {
    name: 'humanoid_frigate_img',
    type: 'image',
    src: 'data/img/render/ships/humanoid/humanoid_frigate_img.png'
},{
    name: 'humanoid_cruiser',
    type: 'tmx',
    src: 'data/outlines/humanoid_cruiser.tmx'
}, {
    name: 'humanoid_cruiser_img',
    type: 'image',
    src: 'data/img/render/ships/humanoid/humanoid_cruiser_img.png'
},{
    name: 'humanoid_battleship',
    type: 'tmx',
    src: 'data/outlines/humanoid_battleship.tmx'
}, {
    name: 'humanoid_battleship_img',
    type: 'image',
    src: 'data/img/render/ships/humanoid/humanoid_battleship_img.png'
},{
    name: 'humanoid_drone',
    type: 'tmx',
    src: 'data/outlines/humanoid_drone.tmx'
}, {
    name: 'humanoid_drone_img',
    type: 'image',
    src: 'data/img/render/ships/humanoid/humanoid_drone_img.png'
},{
    name: 'liquid_frigate',
    type: 'tmx',
    src: 'data/outlines/liquid_frigate.tmx'
}, {
    name: 'liquid_frigate_img',
    type: 'image',
    src: 'data/img/render/ships/liquid/liquid_frigate_img.png'
},{
    name: 'liquid_cruiser',
    type: 'tmx',
    src: 'data/outlines/liquid_cruiser.tmx'
}, {
    name: 'liquid_cruiser_img',
    type: 'image',
    src: 'data/img/render/ships/liquid/liquid_cruiser_img.png'
},{
    name: 'liquid_battleship',
    type: 'tmx',
    src: 'data/outlines/liquid_battleship.tmx'
}, {
    name: 'liquid_battleship_img',
    type: 'image',
    src: 'data/img/render/ships/liquid/liquid_battleship_img.png'
},{
    name: 'liquid_drone',
    type: 'tmx',
    src: 'data/outlines/liquid_drone.tmx'
}, {
    name: 'liquid_drone_img',
    type: 'image',
    src: 'data/img/render/ships/liquid/liquid_drone_img.png'
},{
    name: 'mechanoid_frigate',
    type: 'tmx',
    src: 'data/outlines/mechanoid_frigate.tmx'
}, {
    name: 'mechanoid_frigate_img',
    type: 'image',
    src: 'data/img/render/ships/mechanoid/mechanoid_frigate_img.png'
},{
    name: 'mechanoid_cruiser',
    type: 'tmx',
    src: 'data/outlines/mechanoid_cruiser.tmx'
}, {
    name: 'mechanoid_cruiser_img',
    type: 'image',
    src: 'data/img/render/ships/mechanoid/mechanoid_cruiser_img.png'
},{
    name: 'mechanoid_battleship',
    type: 'tmx',
    src: 'data/outlines/mechanoid_battleship.tmx'
}, {
    name: 'mechanoid_battleship_img',
    type: 'image',
    src: 'data/img/render/ships/mechanoid/mechanoid_battleship_img.png'
},{
    name: 'mechanoid_drone',
    type: 'tmx',
    src: 'data/outlines/mechanoid_drone.tmx'
}, {
    name: 'mechanoid_drone_img',
    type: 'image',
    src: 'data/img/render/ships/mechanoid/mechanoid_drone_img.png'
}, {
    name: 'button',
    type: 'image',
    src: 'data/img/render/button.png'
}, {
    name: 'creatures',
    type: 'image',
    src: 'data/img/render/creatures.png'
}, {
    name: 'creatures_16x16',
    type: 'image',
    src: 'data/img/render/creatures_16x16.png'
}];

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
        me.loader.preload(g_resources);
        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },
    /* ---
    callback when everything is loaded
    --- */
    loaded: function() {
        'use strict';
        // set screens
        var self = this,
            tasks = new utils.TaskWait({
                pendingCount: 4, //must be number of screen loaded
                allDone: function(){
                    //start the game
                    me.state.change(FIRST_SCREEN);
                    self.loadReady = true;
                    self.onAppLoaded();
                },
                error: function(){
                    alert('An error has occurred attempting to load html templates.');
                }
            });
        me.state.LOBBY = me.state.USER;
        me.state.SELECT = me.state.USER + 1;
        me.state.BUILD = me.state.USER + 2;
        me.state.BATTLE = me.state.USER + 3;
        window.FIRST_SCREEN = me.state.LOBBY;

        me.state.set(me.state.LOBBY, new LobbyScreen());
        me.state.set(me.state.SELECT, new ShipSelectScreen());
        me.state.set(me.state.BUILD, new ShipBuildingScreen());
        me.state.set(me.state.BATTLE, new BattleScreen());

        html.store('lobby-screen', tasks.done, tasks.error);
        html.store('ship-select-screen', tasks.done, tasks.error);
        html.store('ship-building-screen', tasks.done, tasks.error);
        html.store('battle-screen', tasks.done, tasks.error);

        chatClient.start();
        //prepare dom
        $('#jsapp').bind('contextmenu', function(e) {
            return false;//disable context menu
        }).attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false);//disable selection



    },
    /*
    useful for testing
    */
    onScreenReset: function() {
       'use strict';
    },
    onAppLoaded: function() {
       'use strict';
    }
};

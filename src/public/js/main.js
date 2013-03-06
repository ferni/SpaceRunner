/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, $, items, RedColorObject, charMap,
html, ShipSelectScreen, ShipBuildingScreen*/

//sugar
var TILE_SIZE = 32;
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
}, {
    name: 'button',
    type: 'image',
    src: 'data/img/render/button.png'
}];

var g_resources_size = [{
    name: 'outline',
    width: 192,
    height: 256
}, {
    name: 'small',
    width: 1440,
    height: 1056
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
        if (!me.video.init('jsapp', 1440, 1152)) {
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

        me.state.SELECT = me.state.USER;
        me.state.BUILD = me.state.USER + 1;

        window.FIRST_SCREEN = me.state.SELECT;

        html.store('ship-select-screen');
        html.store('ship-building-screen');
        // start the game
        me.state.set(me.state.SELECT, new ShipSelectScreen());
        me.state.set(me.state.BUILD, new ShipBuildingScreen());

        me.state.change(me.state.SELECT);
        this.loadReady = true;
        this.onAppLoaded();
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

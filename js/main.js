/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

// game resources
var g_resources = [{
        name: "outline",
        type: "image",
        src: "data/img/render/outline.png"
    },
    {
        name: "selector",
        type: "image",
        src: "data/img/render/selector.png"
    },
    {
        name: "power",
        type: "image",
        src: "data/img/render/power.png"
    },
    {
        name: "small",
        type: "tmx",
        src: "data/outlines/small.tmx"
    }];

var jsApp = {
    /* ---

     Initialize the jsApp

     --- */
    onload: function() {
        // init the video
        if (!me.video.init('jsapp', 640, 480, false, 1.0)) {
            alert("Sorry but your browser does not support html 5 canvas.");
            return;
        }

        // initialize the "audio"
        me.audio.init("mp3,ogg");

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
        // set the "Play/Ingame" Screen Object
        me.state.set(me.state.PLAY, new PlayScreen());

        // start the game
        me.state.change(me.state.PLAY);
    },

    // get tile row and col from pixels
    getTilePosition: function(x, y) {
        var pos = [];
        pos.x = Math.floor(x / me.game.currentLevel.getLayerByName('outline').tilewidth);
        pos.y = Math.floor(y / me.game.currentLevel.getLayerByName('outline').tileheight);
        return pos;
    },

    // get tile position in pixels from pixels
    getTilePosPixels: function(x, y) {
        var tilePos = jsApp.getTilePosition(x, y);
        var pos = [];
        pos.x = tilePos.x * me.game.currentLevel.getLayerByName('outline').tilewidth;
        pos.y = tilePos.y * me.game.currentLevel.getLayerByName('outline').tileheight;
        return pos;
    },

    // get tile position in pixels from row and col
    getTileCoord: function(x, y) {
        var pos = [];
        pos.x = x * me.game.currentLevel.getLayerByName('outline').tilewidth;
        pos.y = y * me.game.currentLevel.getLayerByName('outline').tileheight;
        return pos;
    },

};

var select_tile = null;
var select_layer = null;

// jsApp
/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend({

    onResetEvent: function() {
        // stuff to reset on state change
        me.levelDirector.loadLevel("small");

        select_layer = me.game.currentLevel.getLayerByName("Select");
        select_tile = select_layer.getTileId(0, 0); // pixel coords
        select_layer.clearTile(0,0); // tile coords

        me.input.registerMouseEvent('mousedown', me.game.viewport, this.mouseDown.bind(this));
    },

    mouseDown: function(evt) {
        // Get position of the tile which is being clicked
        var tile_pos = jsApp.getTilePosition(evt.x, evt.y)
        var tile_pixels = jsApp.getTilePosPixels(evt.x, evt.y)

        // Figure out which object is being selected
        object_layer = me.game.currentLevel.getLayerByName("Objects");

        var object = object_layer.getTile(tile_pixels.x, tile_pixels.y);
        console.log(object);
/*
        // What mode object is currently being placed

        // Special case walls

        object_layer = 


        var outline = me.game.currentLevel.getLayerByName("Outline");
        select_layer.setTile(tile_pos.x,tile_pos.y, select_tile);

        //console.log(outline.getTile(tile_pixels.x,tile_pixels.y));
        //console.log(outline.getTileId(tile_pixels.x,tile_pixels.y)); */

        me.game.repaint();



/*

;
    myTileProperty = myLayer.tileset.getTileProperties(myTile.tileId);

    // Uses the property declared in the Tiled - Property Name = material  |  Property Value = fire
    if (myTileProperty.material == "fire")
    {
       // Do the action
    }

It is definitely possible to add entities and change tiles at runtime!
To add entities, create your object with the `new` keyword, and add them to the game engine with me.game.add(). See: http://www.melonjs.org/docs/symbols/me.game.html#add
To change tiles in your map, first get a reference to the map layer: var backgroundLayer = me.game.currentLevel.getLayerByName("background"); then you can get and set the tiles using these methods on the layer reference: http://www.melonjs.org/docs/symbols/me.TiledLayer.html (WARNING! The coordinates passed to these methods are not equivalent! See: https://github.com/obiot/melonJS/issues/107)
*/
//        myTile = myLayer.layerData

    },

    /* ---

     action to perform when game is finished (state change)

     --- */
    onDestroyEvent: function() {
    }

});

//bootstrap :)
window.onReady(function() {
    jsApp.onload();
});

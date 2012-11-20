// game resources
var g_resources = [{
    name: "outline",
    type: "image",
    src: "data/img/render/outline.png"
}, {
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
    pos.x = Math.floor(x / me.game.currentLevel.collisionLayer.tilewidth);
    pos.y = Math.floor(y / me.game.currentLevel.collisionLayer.tileheight);
    return pos;
  },

  // get tile position in pixels from pixels
  getTilePosPixels: function(x, y) {
    var tilePos = jsApp.getTilePosition(x, y);
    var pos = [];
    pos.x = tilePos.x * me.game.currentLevel.collisionLayer.tilewidth;
    pos.y = tilePos.y * me.game.currentLevel.collisionLayer.tileheight;
    return pos;
  },

  // get tile position in pixels from row and col
  getTileCoord: function(x, y) {
    var pos = [];
    pos.x = x * me.game.currentLevel.collisionLayer.tilewidth;
    pos.y = y * me.game.currentLevel.collisionLayer.tileheight;
    return pos;
  },

  isTileSolid: function(x, y) {
    var tilePos = jsApp.getTilePosition(x, y);
    if (me.game.currentLevel.collisionLayer.layerData[~~(tilePos.x)]) {
      var collisionTile = me.game.currentLevel.collisionLayer.layerData[~~(tilePos.x)][~~(tilePos.y)];
      if (jQuery.type(collisionTile) == "object") {
        return true;
      }
      else {
        return false;
      }
    }
  },


};
// jsApp
/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend({

    onResetEvent: function() {
        // stuff to reset on state change
        me.levelDirector.loadLevel("small");
        me.input.registerMouseEvent('mousedown', me.game.viewport, this.mouseDown.bind(this));
    },

    mouseDown: function(evt) {
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
        console.log(evt);

	myTile = myLayer.layerData[~~(this.pos.x / myLayer.tilewidth)][~~(this.pos.y / myLayer.tileheight)]

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

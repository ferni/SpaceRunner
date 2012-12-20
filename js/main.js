/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

// game resources
var g_resources = [
    {name: "outline",   type: "image", src: "data/img/render/outline.png"},
    {name: "selector",  type: "image", src: "data/img/render/selector.png"},
    {name: "weapon",    type: "image", src: "data/img/render/weapon_01.png"},
    {name: "engine",    type: "image", src: "data/img/render/engine_01.png"},
    {name: "power",     type: "image", src: "data/img/render/power_01.png"},
    {name: "console",   type: "image", src: "data/img/render/console_02.png"},
    {name: "component", type: "image", src: "data/img/render/components_01.png"},
    {name: "door",      type: "image", src: "data/img/render/door_01.png"},
    {name: "wall",      type: "image", src: "data/img/render/wall_001.png"},
    {name: "colTile",   type: "image", src: "data/img/render/metatiles32x32.png"},
    {name: "area_01",   type: "tmx",   src: "data/outlines/small.tmx"},
    {name: "test",      type: "tmx",   src: "data/outlines/test.tmx"}
    ];
    
var g_resources_size = [
    {name: "outline",   width: 192, height: 256},
    {name: "small",     width: 576, height: 384},
    {name: "selector",  width:  32, height:  32},
    {name: "weapon",    width:  96, height:  64},
    {name: "engine",    width:  96, height:  64},
    {name: "power",     width:  64, height:  64},
    {name: "console",   width:  32, height:  32},
    {name: "component", width:  64, height:  64},
    {name: "door",      width:  64, height:  32},
    {name: "wall",      width:  32, height:  32},
    {name: "colTile",   width: 160, height:  32},
    ];


var items = {
    getBy: function (property, value) {
        for(var p in this) {
            if(this[p][property] == value) return this[p];
        }
        return null;
    },
    addNames: function () {
        for(var p in this) {
            this[p].name = p;
        }
    },
    weapon: {index:3, Constructor: iWeaponObject, code: "W"},
    engine: {index:4, Constructor: iEngineObject, code: "E"},
    power: {index:5, Constructor: iPowerObject, code: "P"},
    console: {index: 6 ,Constructor: iConsoleObject, code:"C"},
    component: {index: 7 ,Constructor: iComponentObject, code:"O"},
    door: {index: 8 ,Constructor: iDoorObject, code:"D"},
    wall: {index: 9 ,Constructor: iWallObject, code:"+"}
};
items.addNames();

//For loading different ships by adding ship=<name> in the query string.
function getQueriedShip() {
    var defaultShip = "area_01";
    var ship = getParameterByName("ship");
    if(ship === null) return defaultShip;
    for (var i = 0; i < g_resources.length; i++) {
        if(g_resources[i].name == ship && g_resources[i].type == "tmx") {
            return ship;
        }
    }
    alert("Ship \"" + ship + "\" doesn't exist. Loading \""+defaultShip+"\" instead.");
    return defaultShip;
}

var select_item = -1;
var isSelectObject = false;
var SelectObject = null;
var isDragable = false;
var wallDrawing = false;
var DeleteObject = null;

var TILE_SIZE = 0;

//var weaponmng = new WeaponMng();

var jsApp = {
    /* ---

     Initialize the jsApp

     --- */
    onload: function() {
        // init the video
        if (!me.video.init('jsapp', g_resources_size[1].width, g_resources_size[1].height)) {
            alert("Sorry but your browser does not support html 5 canvas.");
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
        // set the "Play/Ingame" Screen Object
        me.state.set(me.state.PLAY, new PlayScreen());
        // start the game
        me.state.change(me.state.PLAY);
        
        
    },
    // get tile row and col from pixels
    getTilePosition: function(x, y) {
        var pos = {};
        pos.x = Math.floor(x / me.game.currentLevel.tilewidth);
        pos.y = Math.floor(y / me.game.currentLevel.tileheight);
        return pos;
    },
    // get tile position in pixels from pixels
    getTilePosPixels: function(x, y) {
        var tilePos = this.getTilePosition(x, y);
        var pos = [];
        pos.x = tilePos.x * me.game.currentLevel.tilewidth;
        pos.y = tilePos.y * me.game.currentLevel.tileheight;
        return pos;
    },
    // get tile position in pixels from row and col
    getTileCoord: function(x, y) {
        var pos = [];
        pos.x = x * me.game.currentLevel.tilewidth;
        pos.y = y * me.game.currentLevel.tileheight;
        return pos;
    },
    initLevel : function(){
         me.game.reset();
         me.levelDirector.loadLevel(getQueriedShip());
//         me.state.set(me.state.PLAY, GameScreen);
    },
};



var checkCollision = {
    RedScreen : [],
    RedIndex : 0,
    TileWidth : 0,
    TileHeight : 0,
    init : function(){
        this.TileWidth = me.game.currentLevel.tilewidth;
        this.TileHeight = me.game.currentLevel.tileheight;
    },
    printRedStyle : function(mX, mY, useTilePosition){
        if(useTilePosition) {
            var coor = jsApp.getTileCoord(mX, mY);
            mX = coor.x;
            mY = coor.y;
        }
        this.RedScreen[this.RedIndex] = new RedColorObject(mX, mY, {});
        me.game.add(this.RedScreen[this.RedIndex], 101);
        this.RedIndex ++;
    },
    removeRedStyle : function(){
        var i = 0;
        for(i = this.RedIndex; i > 0; i -- )
        {
            me.game.remove(this.RedScreen[i - 1]);
            delete this.RedScreen[i - 1];
        }
        this.RedIndex = 0;
    },
    /**/
    
    /* check and process collision of obj*/
    processCollision : function(CurObj){
        //TODO: Replace calls to processCollision(obj) for obj.processCollision()
        //and remove this function from "checkCollision" object.
        return true;
        return CurObj.processCollision();
    },
    
};
// jsApp
/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend({
    iItemID : 0,
    init : function(){
        this.parent(true);
        this.cartel = "asdf";
    },
   onResetEvent: function()
    {
        this.parent(true);
        me.game.reset();
        // stuff to reset on state change
        me.levelDirector.loadLevel(getQueriedShip());
        window.TILE_SIZE =  me.game.currentLevel.tilewidth;
       window.WIDTH = me.game.currentLevel.width;
       window.HEIGHT = me.game.currentLevel.height;
        me.game.sort();
        me.input.bindKey(me.input.KEY.ESC,  "escape");
        me.input.registerMouseEvent('mousedown', me.game.viewport, this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport, this.mouseMove.bind(this));
        me.input.registerMouseEvent('mouseup',   me.game.viewport, this.mouseUp.bind(this));
        me.video.getScreenCanvas().addEventListener("dblclick", this.mouseDbClick, false);
        
        checkCollision.init();
        MapMatrix.init();
        ui.init();
       window.ship = new Ship();
    },
    
    update : function(){
        this.addAsObject = true;
        if( me.input.isKeyPressed("escape") )
        {
            if((SelectObject && select_item != -1) || DeleteObject)
                onMouseClickItem();
        }
    },
    mouseDbClick : function(e) {
        alert(this.cartel);
        if(SelectObject)
        {
            if(SelectObject.mResource == 101)
            {
                removeClassItem(items.wall.index);
                ObjectsMng.addObject(SelectObject);
            }
            else
                removeClassItem(SelectObject.mResource);
            if(SelectObject.mResource != 101 && checkCollision.processCollision(SelectObject))
            {
                me.game.remove(SelectObject);
                delete SelectObject;
            }
            checkCollision.removeRedStyle();
            SelectObject = null;
        }
        isDragable = false;
        select_item = -1;
        wallDrawing = false;
        
        me.game.sort();
        me.game.repaint();
        
    },
    mouseDown: function(e) {
    },
    mouseMove : function(e){
        if(ui.mouseDomain) {//the mouse is involved in a specific object
            ui.mouseDomain.mouseMove();//delegate handling of mouseMove to the object
        }
        if(!ui.chosen) return;
        var mouseTile = utils.toTileVector(me.input.mouse.pos);
        
        ui.moveGhost(mouseTile.x, mouseTile.y);
        me.game.sort();
        me.game.repaint();
        return;
        
        var needsRedrawing = false;
        if(select_item != -1)
        {
            if(select_item == 101)
            {
                mX -= (Math.floor(g_resources_size[items.wall.index].width / (32 * 2)) * 32);
                mY -= (Math.floor(g_resources_size[items.wall.index].height / (32 * 2)) * 32);
            }
            else
            {
                mX -= (Math.floor(g_resources_size[select_item].width / (32 * 2)) * 32);
                mY -= (Math.floor(g_resources_size[select_item].height / (32 * 2)) * 32);
            }
            var mPos = jsApp.getTilePosPixels(mX, mY);
            if(isDragable == false)
            {
                if(select_item == items.wall.index) {
                    SelectObject = new WallGroupObject(this.iItemID);
                    SelectObject.addWallObject(mPos.x, mPos.y);
                }
                else {
                    var item = items.getBy("index", select_item);
                    if(item) {
                        SelectObject = new item.Constructor(mX, mY, { }, this.iItemID);
                    }else {
                        console.warning("The index selected " + select_item + " does not point to a valid item.");
                    }
                    me.game.add( SelectObject, 100 );
                }
                
                this.iItemID ++;
                isDragable = true;

            }
            else if( select_item == items.wall.index )
            {
                SelectObject.process(wallDrawing, mPos);
                needsRedrawing = true;
            }
            else if(SelectObject)
            {
                var prevPosX = SelectObject.pos.x;
                var prevPosY = SelectObject.pos.y;
                if(SelectObject.mResource == 101)
                    SelectObject.movePorcess(mPos.x, mPos.y);
                else
                {
                    if(SelectObject.mResource == items.door.index && SelectObject.rotateFlag)
                    {
                        SelectObject.pos.x = mPos.x + 16;
                        SelectObject.pos.y = mPos.y - 16;
                    }
                    else
                    {
                        SelectObject.pos.x = mPos.x;
                        SelectObject.pos.y = mPos.y;
                    }
                    if(SelectObject.mResource == items.door.index)
                        SelectObject.processRotate();
                    /* collision check */
                    
                }
                if(SelectObject.pos.x != prevPosX || SelectObject.pos.y != prevPosY) {
                    needsRedrawing = true;
                    checkCollision.processCollision(SelectObject);
                }
            }
        }
        if(needsRedrawing) {
            me.game.sort();
            me.game.repaint();
        }
    },
    mouseUp : function(e){
        if(ui.mouseDomain) {//the mouse is involved in a specific object
            ui.mouseDomain.mouseUp();//delegate handling of mouseMove to the object
        }
        if(!ui.chosen) return;
        var mouseTile = utils.toTileVector(me.input.mouse.pos);
        if(ui.chosen.canBuildAt(mouseTile.x, mouseTile.y))
            ship.buildAt(mouseTile.x, mouseTile.y, ui.chosen.type);

        return;
        /* check collision */
        if(select_item == items.wall.index)
        {
            if(wallDrawing == false && 
               !checkCollision.processCollision(SelectObject.getFirstWallObject()))
                    wallDrawing = true;
            else if(wallDrawing == true)
                    SelectObject.setFixFlag();
        }
        else
        {
            if(SelectObject && SelectObject.mid != 101)
            {
                isDragable = checkCollision.processCollision(SelectObject);
                if(!isDragable)
                {
                    SelectObject.mfix = true;
                    if(SelectObject.mResource == items.door.index)
                    {
                        if(!SelectObject.rotateFlag)
                            SelectObject.setCurrentAnimation("v_open_close");
                        else
                            SelectObject.setCurrentAnimation("h_open_close");
                        /* remove wall */
                        SelectObject.removeWallinCollision();
                        SelectObject = null;
                    }
                    else if(SelectObject.mResource == items.component.index )
                        SelectObject.setCurrentAnimation("charge");
                    if(SelectObject)
                        MapMatrix.setUnWalkable(SelectObject.pos.x, SelectObject.pos.y, SelectObject.width, SelectObject.height);
                }
            }
            else
                isDragable = false;
        }
        me.game.sort();
        me.game.repaint();
    },
    /* ---
     action to perform when game is finished (state change)
     --- */
    onDestroyEvent: function() {
    }
});

function Ship(tmxName) {
    this.tmxName = tmxName;
    this.buildings = new Array();
    this.buildAt = function(x, y, buildingType) {
        var item = items[buildingType];
        if(!item) {
            console.error("No such buildingType '" + buildingType + "' (Ship.buildAt()).");
            return;
        }  
        var building = new item.Constructor(x, y, {});
        this.buildings.push(building);
        me.game.add(building, 100);
        this.buildingsMap.update();
        ui.updateGreenSpots();
        
    };
    this._map = null;
    this.map = function() {
        if(this.buildingsMap.changed || this.hullMap.changed || this._map == null) {
            this._map = this._getJointMap();
            this.buildingsMap.changed = false;
            this.hullMap.changed = false;
        }
        return this._map;
    };
    this.buildingsMap = {
        changed: true,
        _buildingsMap: null,
        update: function () {
            console.log("updating buildings");
            var self = this;
            self._buildingsMap = utils.getEmptyMatrix(WIDTH, HEIGHT, charMap.codes._cleared);
            _.each(ship.buildings, function (b) {
                utils.itemTiles(b, function(x,y) {
                    self._buildingsMap[y][x] = b.charCode;
                });
            });
            
            this.changed = true;
        },
        get : function () {
            if(this._buildingsMap === null) this.update();
            return this._buildingsMap;
        }
    },
    this.hullMap = {
        changed: true,
        _hullMap: null,
        update: function () {
            console.log("updating hull");
            this._hullMap = charMap.get();//todo: move the charMap logic to here
            this._changed = true;
        },
        get : function () {
            if(this._hullMap === null) this.update();
            return this._hullMap;
        }
    };
    //joins hullMap and buildingsMap
    this._getJointMap = function() {
        console.log("building joint map");
        var self = this;
        var joint = utils.getEmptyMatrix(WIDTH, HEIGHT, charMap.codes._cleared);
        utils.levelTiles(function(x,y) {
            joint[y][x] = self.hullMap.get()[y][x];
            if(self.buildingsMap.get()[y][x] != charMap.codes._cleared)
                joint[y][x] = self.buildingsMap.get()[y][x];
        });
        return joint;
    };
    
}

/*Everything related to the graphics during the process of building */
var ui = {
   chosen: null,//the chosen object from the panel (an ItemObject)
   mouseDomain: null, //who the mouse actions pertain to. null = the screen itself
   ghostItems:{} ,//Items that exist for the sole purpose of...
                    // ...showing the position at which they will be built.
   
    init: function () {
      this.ghostItems = new Object();//Items to be used when choosing building location
      for(var name in items) {
          if(items[name].Constructor !== undefined) {
              var newItem = new items[name].Constructor(0, 0, {  }, 123);
              this.ghostItems[name] = newItem;
              this.hide(newItem);
              me.game.add(newItem, 100);
          }
      }
        this.greenSpots = utils.getEmptyMatrix(WIDTH, HEIGHT, 0);
    },
   choose:function(name)
   {
       if(this.chosen) {
           if(this.chosen.type == name) return;
           this.hide(this.chosen);
       }
       this.chosen = this.ghostItems[name];
       if(!this.chosen) return;
       this.show(this.chosen);
       this.updateGreenSpots();
       
   },
    show:function (obj) {
        
    },
    hide:function (obj) {
        obj.x(-100).y(-100);
    },
   moveGhost: function(x,y) {
       var shouldUpdateRed = false;
       if(x != this.chosen.x() || y != this.chosen.y())
           shouldUpdateRed = true;
       this.chosen.x(x).y(y);
       if(shouldUpdateRed) {
           this.clearRed();
           var self = this;
           utils.itemTiles(this.chosen, function(iX, iY) {
               if(self.greenSpots[iY][iX] == 0) self.printRed(iX, iY);
           });
       }
   },
   
   redScreen : [],
   redIndex : 0,
   printRed : function(x, y){
        this.redScreen[this.redIndex] = new RedColorObject(x, y, {});
        me.game.add(this.redScreen[this.redIndex], 101);
        this.redIndex ++;
   },
   clearRed : function(){
        var i = 0;
        for(i = this.redIndex; i > 0; i -- )
        {
            me.game.remove(this.redScreen[i - 1]);
            delete this.redScreen[i - 1];
        }
        this.redIndex = 0;
    },
   //A matrix of 1 and 0. In 0 should be red overlay when trying to build
   greenSpots: null,
   updateGreenSpots: function () {
       var self = this;
       self.greenSpots = utils.getEmptyMatrix(WIDTH, HEIGHT, 0);
       utils.levelTiles(function(x, y) {
           if(self.chosen.canBuildAt(x,y)) {
               for (var i = x; i < self.chosen.size[0] + x && i < WIDTH; i++) {
                    for (var j = y; j < self.chosen.size[1] + y && j < HEIGHT; j++) {
                        self.greenSpots[j][i] = 1;
                    }
                }
           }
       });
   }
};

var utils = {
    toTileVector: function(vector2D) {
        var v = new me.Vector2d();
        v.x = Math.floor(vector2D.x / me.game.currentLevel.tilewidth);
        v.y = Math.floor(vector2D.y / me.game.currentLevel.tileheight);
        return v;
    },
    //useful when wanting to do something at every coordinate of a matrix
    matrixTiles : function (width, height, callback) {//the callback must have x and y
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                callback(x, y);
            }
        }
    },
    //useful when wanting to do something at every coordinate of the level
    levelTiles: function (callback) {//the callback must have x and y
        utils.matrixTiles(WIDTH, HEIGHT, callback);
    },
    //traverses every tile coordinate inside the level of an item
    itemTiles: function(item, callback) {//the callback must have x and y
        for (var x = item.x(); x < item.size[0] + item.x() && x < WIDTH && x >=0; x++) {
                for (var y = item.y(); y < item.size[1] + item.y() && y < HEIGHT && y >=0; y++) {
                    callback(x, y);
                }
            }
    },
    getEmptyMatrix: function (width, height, initialValue) {
            var matrix = new Array();
            for (var i = 0; i < height; i++) {
                matrix.push(new Array());
                for (var j = 0; j < width; j++) {
                    matrix[i].push(initialValue);
                }
            }
            return matrix;
        }
};

//bootstrap :)
window.onReady(function() {
    jsApp.onload();
});

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
    initLevel : function(){
         me.game.reset();
         me.levelDirector.loadLevel(utils.getQueriedShip());
//         me.state.set(me.state.PLAY, GameScreen);
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
        me.levelDirector.loadLevel(utils.getQueriedShip());
        window.TILE_SIZE =  me.game.currentLevel.tilewidth;
       window.WIDTH = me.game.currentLevel.width;
       window.HEIGHT = me.game.currentLevel.height;
        me.game.sort();
        me.input.bindKey(me.input.KEY.ESC,  "escape");
        me.input.registerMouseEvent('mousedown', me.game.viewport, this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport, this.mouseMove.bind(this));
        me.input.registerMouseEvent('mouseup',   me.game.viewport, this.mouseUp.bind(this));
        
        me.video.getScreenCanvas().addEventListener("dblclick", this.mouseDbClick, false);
        
        ui.init();
       window.ship = new Ship();
    },
    
    update : function(){
        this.addAsObject = true;
        if( me.input.isKeyPressed("escape"))
        {
            if(ui.chosen)
              ui.choose();
            if(ui.mouseLockedOn){
              ui.mouseLockedOn.lockedEscape();
              return;
            }
        }
    },
    mouseDbClick : function(e) {
        var mouseTile = utils.toTileVector(me.input.mouse.pos);
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseDbClick(mouseTile);//delegate handling to the object
            return;
        }
        
        me.game.sort();
        me.game.repaint();
        
    },
    mouseDown: function(e) {
        var mouseTile = utils.toTileVector(me.input.mouse.pos);
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseDown(mouseTile);//delegate handling to the object
            return;
        }
        
        if(ship.map()[mouseTile.y] !== undefined && ship.map()[mouseTile.y][mouseTile.x] !== undefined) {
            var item = ship.map()[mouseTile.y][mouseTile.x];
            if(item.name == "Building") {
                ui.selected = item;
            }else {
                ui.selected = null;
            }
        }
    },
    mouseMove : function(e){
        var mouseTile = utils.toTileVector(me.input.mouse.pos);
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseMove(mouseTile);//delegate handling to the object
            return;
        }
        if(!ui.chosen) return;
        
        
        ui.moveGhost(mouseTile.x, mouseTile.y);
        me.game.sort();
        me.game.repaint();
        
    },
    mouseUp : function(e){
        var mouseTile = utils.toTileVector(me.input.mouse.pos);
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseUp(mouseTile);//delegate handling to the object
            return;
        }
        if(!ui.chosen) return;
        
        ship.buildAt(mouseTile.x, mouseTile.y, ui.chosen.type);

        me.game.sort();
        me.game.repaint();
        
    },
    /* ---
     action to perform when game is finished (state change)
     --- */
    onDestroyEvent: function() {
    }
});

function Ship() {
    this.buildings = new Array();
    this.buildAt = function(x, y, buildingType) {
        var self = this;
        var building = utils.makeItem(x, y, buildingType);
        var canBuild = building.canBuildAt(x, y);
        if(!canBuild) {
            var canBuildRotated = building.canBuildRotated(x, y);
            if (canBuildRotated) {
                building.rotated(true);
            }
        }
        if(canBuild || canBuildRotated) {
            building.x(x).y(y);
            //remove anything in its way
            utils.itemTiles(building, function(iX, iY) {
                self.removeAt(iX,iY);
            });
            this.buildings.push(building);
            me.game.add(building, building.zIndex);
            
            this.update();
            building.onBuilt();
        }
    };
    this.update = function() {
            this.buildingsMap.update();
            ui.updateGreenSpots();
            me.game.sort();
            me.game.repaint();
    };
    this.add = function(item) {
        me.game.add(item, item.zIndex);
        this.buildings.push(item);
    };
    this.removeAt = function(x, y) {
        if(this.map()[y][x] == charMap.codes._cleared) return;
        var self = this;
        _.each(this.buildings, function(b) {
            if(b.occupies(x,y)) {
                self.remove(b, false);
            }
        });
        this.buildingsMap.update();
    };
    this.remove = function(item, updateBuildings) {
        if(updateBuildings === undefined) 
            updateBuildings = true;//updates by default
        var index = _.indexOf(this.buildings, item);
        this.buildings.splice(index, 1);
        me.game.remove(item);
        if(updateBuildings)
            this.buildingsMap.update();

        me.game.repaint();
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
            var self = this;
            self._buildingsMap = utils.getEmptyMatrix(WIDTH, HEIGHT, charMap.codes._cleared);
            _.each(ship.buildings, function (b) {
                utils.itemTiles(b, function(x,y) {
                    self._buildingsMap[y][x] = b;
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
        update: function () {;
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
        var self = this;
        var joint = utils.getEmptyMatrix(WIDTH, HEIGHT, charMap.codes._cleared);
        utils.levelTiles(function(x,y) {
            joint[y][x] = self.hullMap.get()[y][x];
            if(self.buildingsMap.get()[y][x] != charMap.codes._cleared)
                joint[y][x] = self.buildingsMap.get()[y][x];
        });
        return joint;
    };
    this.toJsonString = function() {
        return JSON.stringify(_.map(this.buildings, function (b) {
            return {
                type: b.type, 
                x: b.x(), 
                y: b.y(),
                rotated: b.rotated()
            };
        }));
    };
    this.fromJsonString = function(jsonString) {
        var buildingsArray = new Array();
        for (var j = this.buildings.length - 1; j >= 0; j--) {
            buildingsArray.push(this.buildings[j]);
        }
        for (var k = 0; k < buildingsArray.length; k++) {
            this.remove(buildingsArray[k], false);
        }
        this.update();
        var itemArray = JSON.parse(jsonString);
        for (var i = 0; i < itemArray.length; i++) {
            var item = utils.makeItem(itemArray[i].x, itemArray[i].y, itemArray[i].type);
            item.rotated(itemArray[i].rotated);
            this.add(item);
        }
        this.update();
    };
    
}








/*Everything related to the graphics during the process of building */
var ui = {
   chosen: null,//the chosen object from the panel (an ItemObject)
   mouseLockedOn: null, //who the mouse actions pertain to. 
   ghostItems:{} ,//Items that exist for the sole purpose of...
                    // ...showing the position at which they will be built.
   selected: null,//selected item from the ship
    init: function () {
      this.ghostItems = new Object();//Items to be used when choosing building location
      for(var name in items) {
          if(items[name].Constructor !== undefined) {
              var newItem = new items[name].Constructor(0, 0, {  }, 123);
              this.ghostItems[name] = newItem;
              this.hide(newItem);
              me.game.add(newItem, newItem.zIndex+1000);
          }
      }
        this.greenSpots = utils.getEmptyMatrix(WIDTH, HEIGHT, 0);
    },
   choose:function(name)
   {
       if(this.chosen) {
           if(this.chosen.type == name) return;
           this.hide(this.chosen);
           this.clearRed();
           
           me.game.repaint();
       }
       this.chosen = this.ghostItems[name];
       if(!this.chosen) return;
       this.show(this.chosen);
       this.updateGreenSpots();
       
       me.game.repaint();
   },
    show:function (obj) {
        
    },
    hide:function (obj) {
        obj.x(-100).y(-100);
    },
   moveGhost: function(x,y) {
       this.chosen.x(x).y(y);
       //Rotate if it fits somewhere
       if(!this.chosen.rotated() && this.chosen.canBuildRotated(x,y))
           this.chosen.rotated(true);
       if(this.chosen.rotated() && this.chosen.canBuildAt(x,y)) 
           this.chosen.rotated(false);
       this.updateRed();
   },
   
   redScreen : [],
   redIndex : 0,
   printRed : function(x, y){
        this.redScreen[this.redIndex] = new RedColorObject(x, y, {});
        me.game.add(this.redScreen[this.redIndex], this.redScreen[this.redIndex].zIndex +1000);
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
   updateRed: function() {
       this.clearRed();
        var self = this;
        utils.itemTiles(this.chosen, function(iX, iY) {
            if(self.greenSpots[iY][iX] == 0) self.printRed(iX, iY);
        });
   },
   //A matrix of 1 and 0. In 0 should be red overlay when trying to build
   greenSpots: null,
   updateGreenSpots: function () {
       var self = this;
       if(!this.chosen) return;
       self.greenSpots = utils.getEmptyMatrix(WIDTH, HEIGHT, 0);
       utils.levelTiles(function(x, y) {
           var i, j;
           if(self.chosen.canBuildAt(x, y)) {
               for ( i = x; i < self.chosen.size[0] + x && i < WIDTH; i++) {
                    for ( j = y; j < self.chosen.size[1] + y && j < HEIGHT; j++) {
                        self.greenSpots[j][i] = 1;
                    }
                }
           }
           if(self.chosen.canBuildRotated(x, y)) {
               for ( i = x; i < self.chosen.size[1] + x && i < WIDTH; i++) {
                    for ( j = y; j < self.chosen.size[0] + y && j < HEIGHT; j++) {
                        self.greenSpots[j][i] = 1;
                    }
                }
           }
       });
   },
   drawingScreen: [],
   //draws arbitrary stuff
   draw: function (x,y,type) {
       var item = utils.makeItem(x, y, type);
       me.game.add(item, item.zIndex+ 1000);
       this.drawingScreen.push(item);
       me.game.sort();
       me.game.repaint();
       
   },
   clear: function (amount) {
        if(amount === undefined)
        {
          amount = this.drawingScreen.length;
        }
       for (var i = amount - 1; i >= 0; i--) {
         me.game.remove(this.drawingScreen[i]);
         this.drawingScreen.pop();
       };

       this.clearRed();
       
       me.game.sort();
       me.game.repaint();
   },
   //combines the ship map with the drawing screen
   mapAt: function(x,y){
       for (var i = 0; i < this.drawingScreen.length; i++) {
           if(this.drawingScreen[i].occupies(x,y))
               return this.drawingScreen[i];
       }
       var shipTile = null;
       if(ship.map()[y] !== undefined && ship.map()[y][x] !== undefined)
           shipTile = ship.map()[y][x];
       
       if(shipTile == charMap.codes._cleared && this.chosen && this.chosen.occupies(x,y))
           return this.chosen;
       return shipTile;
   }
   
};


//bootstrap :)
window.onReady(function() {
    jsApp.onload();
});

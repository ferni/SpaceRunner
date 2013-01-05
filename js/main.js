/*
-*- coding: utf-8 -*-
 vim: set ts=4 sw=4 et sts=4 ai:
 */

// game resources
// in the case of the items, set their image name equal to their type.
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
    {name: "small",     width: 576, height: 384}
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
    weapon: {Constructor: iWeaponObject},
    engine: {Constructor: iEngineObject},
    power: {Constructor: iPowerObject},
    console: {Constructor: iConsoleObject},
    component: {Constructor: iComponentObject},
    door: {Constructor: iDoorObject},
    wall: {Constructor: iWallObject}
};
items.addNames();

var mouseButtons = {
    left: 1,
    wheel: 2,
    right: 3
};

var TILE_SIZE = 0;

var jsApp = {
    /* ---

     Initialize the jsApp

     --- */
    onload: function() {
        // init the video
        if (!me.video.init('jsapp', 576, 384)) {
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
        me.state.set(me.state.PLAY, new PlayScreen(utils.getQueriedShip()));
        // start the game
        me.state.change(me.state.PLAY);
    }
};


// jsApp
/* the in game stuff*/
var PlayScreen = me.ScreenObject.extend({
    iItemID : 0,

    init : function(shipName){
        this.parent(true);
        this.shipName = shipName;
    },
   onResetEvent: function(finishedResetCallback)
    {
        this.parent(true);
        me.game.reset();
        // stuff to reset on state change
        me.levelDirector.loadLevel(this.shipName);
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
        if(finishedResetCallback !== undefined)
          finishedResetCallback();
    },
    
    update : function(){
        this.addAsObject = true;
        if( me.input.isKeyPressed("escape"))
        {
            if(ui.mouseLockedOn){
              ui.mouseLockedOn.lockedEscape();
              return;
            }
            if(ui.chosen)
              ui.choose();
            
        }
    },
    mouseDbClick : function(e) {
        var mouseTile = utils.getMouse();
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseDbClick(mouseTile);//delegate handling to the object
            return;
        }
        
        me.game.sort();
        me.game.repaint();
        
    },
    mouseDown: function(e) {
        var mouseTile = utils.getMouse();
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseDown(mouseTile);//delegate handling to the object
            return;
        }
        
        var item = ship.mapAt(mouseTile.x,mouseTile.y);
        
        if(item != null && item.name == "Building") {
            if(e.which == mouseButtons.right) {
                ship.remove(item);
            }
            else {
                ui.selected = item;
                if (!ui.chosen) {
                    ui.beginDrag(item);

                } else {
                    ui.selected = null;
                }
            }
        }
    },
    mouseMove : function(e){
        var mouseTile =  utils.getMouse();
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
        var mouseTile =  utils.getMouse();
        if(ui.mouseLockedOn) {//the mouse is involved in a specific object
            ui.mouseLockedOn.lockedMouseUp(mouseTile);//delegate handling to the object
            return;
        }
        
        if(ui.chosen && !ui.dragging) {
            if (e.which != mouseButtons.right) {
                ship.buildAt(mouseTile.x, mouseTile.y, ui.chosen.type);
            }
        } else if(ui.dragging) {
            ui.endDrag();
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

function Ship() {
    this.buildings = new Array();
    //this should be called when the user builds something
    this.buildAt = function(x, y, buildingType) {
        var self = this;
        var building = utils.makeItem(buildingType);
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
            this.add(building);
            
            this.update();
            building.onBuilt();
            return true;//building successful
        }
        return false;//building failed
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
        item.onShip(true);
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
        if(!item) return;
        if(updateBuildings === undefined) 
            updateBuildings = true;//updates by default
        var index = _.indexOf(this.buildings, item);
        this.buildings.splice(index, 1);
        me.game.remove(item);
        
        if(updateBuildings)
            this.update();

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
    this.mapAt = function(x,y){
       if(ship.map()[y] !== undefined && ship.map()[y][x] !== undefined)
           return ship.map()[y][x];
        return null;
    };
    this.buildingsMap = {
        changed: true,
        _buildingsMap: null,
        update: function () {
            var self = this;
            self._buildingsMap = utils.getEmptyMatrix(WIDTH, HEIGHT, charMap.codes._cleared);
            _.each(ship.buildings, function (b) {
                if(!b.hidden()) {
                    utils.itemTiles(b, function(x, y) {
                        self._buildingsMap[y][x] = b;
                    });
                }
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
            var item = utils.makeItem(itemArray[i].type);
            item.x(itemArray[i].x)
                .y(itemArray[i].y)
                .rotated(itemArray[i].rotated);
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
              newItem.hide();
              me.game.add(newItem, newItem.zIndex+1000);
              newItem.onShip(false);
          }
      }
        this.greenSpots = utils.getEmptyMatrix(WIDTH, HEIGHT, 0);
    },
   choose:function(name)
   {
       if(this.chosen) {
           if(this.chosen.type == name) return;
           this.chosen.hide();
           this.clearRed();
           $("#item_"+ ui.chosen.type).removeClass("chosen");

           me.game.repaint();
       }
       this.chosen = this.ghostItems[name];
       if(!this.chosen) return;
       var mouse = utils.getMouse();
       this.chosen
           .x(mouse.x)
           .y(mouse.y)
           .show();
       this.updateGreenSpots();

       $("#item_"+ ui.chosen.type).addClass("chosen");
       me.game.sort();
       me.game.repaint();
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
   //Dragging
   dragging: null,
   beginDrag: function (building) {
       if(this.chosen) {
           console.log("There should be nothing chosen when drag begins. (ui.beginDrag)");
       }
       building.hide();
       ship.buildingsMap.update();
       this.choose(building.type);
       this.dragging = building;
   },
   endDrag: function () {
       if(!this.dragging) return;
       var mouse = utils.getMouse();
       if(this.dragging.canBuildAt(mouse.x,mouse.y)) {
           this.dragging.x(mouse.x).y(mouse.y);
       }
       this.dragging.show();
       ship.buildingsMap.update();
       this.choose();
       this.dragging = null;
   },
   //Red overlay
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
       var item = utils.makeItem(type).x(x).y(y);
       me.game.add(item, item.zIndex+ 1000);
       this.drawingScreen.push(item);
       me.game.sort();
       me.game.repaint();
       
   },
   clear: function () {
       _.each(this.drawingScreen, function(i) {
           me.game.remove(i);
       });
       this.drawingScreen = new Array();
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

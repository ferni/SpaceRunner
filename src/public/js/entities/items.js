/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, pr, ItemEntity, PF, hullMap, utils, width, height*/

/* individual object class */
var ItemEntity = TileEntity.extend({
    init: function(x, y, settings) {
        'use strict';
        this.onShipAnimations = {
            normal: null,
            rotated: null
        };
        this.offShipAnimations = {
            normal: null,
            rotated: null
        };
        if (settings === undefined) {
            settings = {};
        }
        if (!settings.name) {
            settings.name = 'item';
        }
        this.parent(x, y, settings);
        this.buildPlacementRules();
    },

    updateAnimation: function() {
        var anim;
        if(this._onShip){
            if(this.m.rotated){
                anim = this.onShipAnimations.rotated;
            }else{
                anim = this.onShipAnimations.normal;
            }
        }else{
            if(this.m.rotated){
                anim = this.offShipAnimations.rotated;
            }else{
                anim = this.offShipAnimations.normal;
            }
        }
        if (anim) {
            this.setCurrentAnimation(anim);
        }
    },
    /*functions to do when mouse-locked (override in each item)
     mouseTile : Vector2D
     */
    lockedMouseUp: function(mouseTile) { 'use strict'; },
    lockedMouseDown: function(mouseTile) { 'use strict'; },
    lockedMouseMove: function(mouseTile) { 'use strict'; },
    lockedMouseDbClick: function(mouseTile) { 'use strict'; },
    placementRules: [],
    buildPlacementRules: function() {
        'use strict';
        this.placementRules = [];
        this.placementRules.push(pr.make.spaceRule(sh.tiles.clear,
            this.size[0], this.size[1]));
    },

    canBuildAt: function(x, y, ship) {
        'use strict';
        return _.every(this.placementRules, function(r) {
            return r.compliesAt(x, y, ship.map());
        });
    },
    canBuildRotated: function(x, y, ship) {
        'use strict';
        return false;
    },
    rotated: function(rotated) {
        'use strict';
        var prev = this.m.rotated;
        if (rotated === undefined) {
            return this.m.rotated;
        }
        if (rotated) {
            this.angle = Math.PI / 2;
        } else {
            this.angle = 0;
        }
        this.m.rotated = rotated;
        if (prev !== this.m.rotated) {
            this.updateAnimation();
        }
        return this;
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        if (index === undefined) { //can pass an index: 0= width, 1= height
            return this.rotated() ? [this.size[1], this.size[0]] : this.size;
        }
        if (this.rotated()) {
            index = (index === 1) ? 0 : 1; //toggles 1 and 0
        }
        return this.size[index];
    },
    //callback must have x and y. withinSize is optional
    tiles: function(callback ,withinSize) {
        'use strict';
        var x, y;
        for (x = this.x; x < this.trueSize(0) + this.x &&
            (!withinSize || x < withinSize.width) && x >= 0; x++) {
            for (y = this.y; y < this.trueSize(1) + this.y &&
                (!withinSize || y < withinSize.height) && y >= 0; y++) {
                callback(x, y);
            }
        }
    },
    //returns true is some part of the item is occupying the tile
    occupies: function(x, y) {
        'use strict';
        var occupies = false;
        this.tiles(function(tX, tY) {
            if (x === tX && y === tY) {
                occupies = true;
            }
        });
        return occupies;
    },
    //onBuilt is called only when the user himself builds it
    onBuilt: function() {
        'use strict';
        if (!me.state.isCurrent('ship-building')) {
            console.error('item.onBuilt called when not building the ship');
            return;
        }
        //abstract method
    },
    temp: {} //for storing temporary stuff
    ,
    _onShip: false,
    onShip: function(onShip) {
        'use strict';
        var prev = this._onShip;
        if (onShip === undefined) {
            return this._onShip;
        }

        this._onShip = onShip;
        if (prev !== this._onShip) {
            this.updateAnimation();
            if (onShip) {
                this.whenOnShip();
            } else {
                this.whenOffShip();
            }
        }
        return this;
    },
    whenOnShip: function() {
        'use strict';
    },
    whenOffShip: function() {
        'use strict';
    },


    toJson: function(){
        var self = this;
        return {
            type: self.type,
            x: self.x,
            y: self.y,
            rotated: self.rotated(),
            settings: {}
        }
    }
});




/*
    In each item, set size and type before calling parent()
*/
// weapon object
var WeaponItem = ItemEntity.extend({
    // init function
    init: function(weaponModel) {
        'use strict';
        this.type = 'weapon';
        this.size = [2, 2];
        this.totalSize = [3, 2];
        this.m = weaponModel;
        this.parent(weaponModel.x, weaponModel.y, {});
    },
    buildPlacementRules: function() {
        'use strict';
        this.parent();
        this.placementRules.push(new pr.PlacementRule({
            tile: sh.tiles.front,
            inAny: [{
                x: 2,
                y: 0
            }, {
                x: 2,
                y: 1
            }]
        }));
    }
});

// engine object
var EngineItem = ItemEntity.extend({
    // init function
    init: function(engineModel) {
        'use strict';
        this.type = 'engine';
        this.size = [2, 2];
        this.totalSize = [3, 2];
        this.cannonTile = [1, 0];
        this.m = engineModel;
        this.parent(engineModel.x, engineModel.y, {});
    },
    buildPlacementRules: function() {
        'use strict';
        this.parent();
        this.placementRules.push(new pr.PlacementRule({
            tile: sh.tiles.back,
            inAll: [{
                x: -1,
                y: 0
            }, {
                x: -1,
                y: 1
            }]
        }));
    }
});


// power object
var PowerItem = ItemEntity.extend({
    // init function
    init: function(powerModel) {
        'use strict';
        this.type = 'power';
        this.size = [2, 2];
        this.m = powerModel;
        this.parent(powerModel.x, powerModel.y, {});
    }
});

// console object class
var ConsoleItem = ItemEntity.extend({
    // init function
    init: function(consoleModel) {
        'use strict';
        this.type = 'console';
        this.size = [1, 1];
        this.m = consoleModel;
        this.parent(consoleModel.x, consoleModel.y, {});
    },
    buildPlacementRules: function() {
        'use strict';
        this.parent();
        this.placementRules.push(pr.make.nextToRule(function(tile) {
            return tile.type === 'weapon' || tile.type === 'engine' ||
            tile.type === 'power';
        }, this.size[0], this.size[1]));
    }
});

// component object class
var ComponentItem = ItemEntity.extend({
    // init function
    init: function(componentModel) {
        'use strict';
        this.type = 'component';
        this.size = [2, 2];
        this.m = componentModel;
        this.parent(componentModel.x, componentModel.y, {});
        // add animation
        this.addAnimation('idle', [3]);
        this.addAnimation('charge', [0, 1, 2, 3, 4, 5, 5]);
        // set animation
        this.offShipAnimations.normal = 'idle';
        this.onShipAnimations.normal = 'charge';
        this.animationspeed = 15;
        this.setCurrentAnimation('idle');
    }
});

// door object class
var DoorItem = ItemEntity.extend({
    // init function
    init: function(doorModel) {
        'use strict';
        this.type = 'door';
        this.size = [2, 1];
        this.m = doorModel;
        this.rotated(this.m.rotated); //force change angle
        this.parent(doorModel.x, doorModel.y, {});

        // add animation
        this.addAnimation('idle', [2]);
        this.addAnimation('v_idle', [3]);
        this.addAnimation('h_open_close',
            [0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 2, 0]);
        this.addAnimation('v_open_close',
            [1, 3, 5, 7, 9, 11, 11, 9, 7, 5, 3, 1]);
        this.anchorPoint.x = 0.25;
        this.anchorPoint.y = 0.5;
        // set animation
        this.offShipAnimations.normal = 'idle';
        this.offShipAnimations.rotated = 'v_idle';
        this.onShipAnimations.normal = 'h_open_close';
        this.onShipAnimations.rotated = 'v_open_close';
        this.animationspeed = 10;
        this.setCurrentAnimation('idle');
        this.zIndex = 110;
    },
    buildPlacementRules: function() {
        'use strict';
        //doesn't use inherited placementRules
        this.placementRules = [pr.make.spaceRule(function(tile) {
            return tile.type === 'wall' && tile.isCurrentAnimation('lrWall');
        }, 2, 1)];
        this.rotatedPlacementRules = [pr.make.spaceRule(function(tile) {
            return tile.type === 'wall' && tile.isCurrentAnimation('tbWall');
        }, 1, 2)];
    },
    canBuildRotated: function(x, y, ship) {
        'use strict';
        return _.every(this.rotatedPlacementRules, function(r) {
            return r.compliesAt(x, y, ship.map());
        });
    }

});
// wall object class
var WallItem = ItemEntity.extend({
    // init function
    init: function(wallModel) {
        'use strict';
        this.type = 'wall';
        this.size = [1, 1];
        this.m = wallModel;
        this.parent(wallModel.x, wallModel.y, {});
        // add animation
        //Wall connects: t=top, l=left, b=bottom, r=right
        this.addAnimation('lr', [0]);
        this.addAnimation('tb', [1]);
        this.addAnimation('tr', [2]);
        this.addAnimation('tlr', [3]);
        this.addAnimation('tlbr', [4]);
        this.addAnimation('tl', [5]);
        this.addAnimation('br', [6]);
        this.addAnimation('lbr', [7]);
        this.addAnimation('lb', [8]);
        this.addAnimation('tlb', [9]);
        this.addAnimation('tbr', [10]);
        // set animation
        this.setCurrentAnimation('lr');
        this.animationspeed = 6;
    },
    updateAnimation: function() {
        'use strict';
        var wallsAround, animationName;
        wallsAround = [];
        if (this.m.connected.top) {
            wallsAround.push('t');
        }
        if (this.m.connected.left) {
            wallsAround.push('l');
        }
        if (this.m.connected.bottom) {
            wallsAround.push('b');
        }
        if (this.m.connected.right) {
            wallsAround.push('r');
        }
        if (wallsAround.length === 0) {
            this.setCurrentAnimation('lr'); //default
            return;
        }
        if (wallsAround.length === 1) { //just one connection
            if (wallsAround[0] === 't' || wallsAround[0] === 'b') {
                this.setCurrentAnimation('tb');
                return;
            }
            if (wallsAround[0] === 'l' || wallsAround[0] === 'r') {
                this.setCurrentAnimation('lr');
                return;
            }
        }
        animationName = wallsAround.join('');
        this.setCurrentAnimation(animationName);
    },
    update: function() {
        'use strict';
        //TODO: update only when necessary, right now it's running all the time
        var screen = me.state.current(),
            top = screen.mapAt(this.x, this.y - 1),
            left = screen.mapAt(this.x - 1, this.y),
            bot = screen.mapAt(this.x, this.y + 1),
            right = screen.mapAt(this.x + 1, this.y);
        top = utils.getModel(top);
        left = utils.getModel(left);
        bot = utils.getModel(bot);
        right = utils.getModel(right);
        this.m.updateConnections(top, left, bot, right);
        this.updateAnimation();
    },
    onBuilt: function() {
        'use strict';
        var pfMatrix, t, ui;
        this.parent();
        ui = me.state.current();
        if (ui.mouseLockedOn === this) {
            return;
        }
        pfMatrix = ui.ship.getPfMatrix();
        //self tile will be walkable for pathfinding purposes
        pfMatrix[this.y][this.x] = 0;

        t = this.temp;
        t.grid = new PF.Grid(width(), height(), pfMatrix);
        t.preMouseX = this.x;
        t.preMouseY = this.y;
        t.pivotX = this.x;
        t.pivotY = this.y;
        t.path = null;
        t.finder = new PF.BestFirstFinder();
        ui.mouseLockedOn = this;
    },
    lockedMouseMove: function(mouseTile) {
        'use strict';
        var t, cloneGrid, ui;
        this.parent();
        ui = me.state.current();
        t = this.temp;

        if ((mouseTile.x === t.pivotX && mouseTile.y === t.pivotY) ||
            (mouseTile.x === t.preMouseX && mouseTile.y === t.preMouseY)) {
            return;
        }
        t.preMouseX = mouseTile.x;
        t.preMouseY = mouseTile.y;
        ui.clear();

        cloneGrid = t.grid.clone();
        t.path = t.finder.findPath(t.pivotX, t.pivotY,
            mouseTile.x, mouseTile.y, cloneGrid);
        _.each(t.path, function(p){
            ui.drawItem(p[0], p[1], 'wall');
        });
    },
    lockedMouseUp: function(mouseTile) {
        'use strict';
        var ui = me.state.current();
        this.parent();
        if (!this.canBuildAt(mouseTile.x, mouseTile.y,
            me.state.current().ship)) {
            return;
        }
        _.each(ui.drawingScreen, function(wall) {
            ui.ship.buildAt(wall.x, wall.y, 'wall');
        });
        ui.clear();
        ui.mouseLockedOn = null;
    },
    lockedEscape: function() {
        'use strict';
        var ui = me.state.current();
        ui.clear();

        ui.mouseLockedOn = null;
        ui.ship.remove(this);
    }
});
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, pr, ItemEntity, PF, hullMap, utils, width, height*/

/* individual object class */
var ItemEntity = TileEntity.extend({
    onShipAnimations: [], //0: not rotated, 1: rotated
    offShipAnimations: [], //0: not rotated, 1: rotated
    //2x2 grid
    animationGrid: [], //0: offShip, 1: onShip

    init: function(x, y, settings) {
        'use strict';
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
        var animRow, anim, rowIndex, colIndex;
        rowIndex = utils.boolToInt(this._onShip);
        colIndex = utils.boolToInt(this._rotated);
        animRow = this.animationGrid[rowIndex];
        if (animRow) {
            anim = animRow[colIndex];
            if (anim) {
                this.setCurrentAnimation(anim);
            }
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
    _rotated: false,
    rotated: function(rotated) {
        'use strict';
        var prev = this._rotated;
        if (rotated === undefined) {
            return this._rotated;
        }
        if (rotated) {
            this.angle = Math.PI / 2;
        } else {
            this.angle = 0;
        }
        this._rotated = rotated;
        if (prev !== this._rotated) {
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
        this.parent(componentModel.x, componentModel.y, {});
        // add animation
        this.addAnimation('idle', [3]);
        this.addAnimation('charge', [0, 1, 2, 3, 4, 5, 5]);
        // set animation
        this.offShipAnimations = ['idle', 'idle'];
        this.onShipAnimations = ['charge', 'charge'];
        this.animationGrid = [this.offShipAnimations, this.onShipAnimations];
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
        this.offShipAnimations = ['idle', 'v_idle'];
        this.onShipAnimations = ['h_open_close', 'v_open_close'];
        this.animationGrid = [this.offShipAnimations, this.onShipAnimations];
        this.animationspeed = 10;
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
        this.parent(wallModel.x, wallModel.y, {});
        // add animation
        //Wall connects: t=top, l=left, b=bottom, r=right
        this.addAnimation('lrWall', [0]);
        this.addAnimation('tbWall', [1]);
        this.addAnimation('trWall', [2]);
        this.addAnimation('tlrWall', [3]);
        this.addAnimation('tlbrWall', [4]);
        this.addAnimation('tlWall', [5]);
        this.addAnimation('brWall', [6]);
        this.addAnimation('lbrWall', [7]);
        this.addAnimation('lbWall', [8]);
        this.addAnimation('tlbWall', [9]);
        this.addAnimation('tbrWall', [10]);
        // set animation
        this.setCurrentAnimation('lrWall');
        this.animationspeed = 6;
    },
    updateAnimation: function() {
        'use strict';
        var wallsAround, x, y, top, left, bot, right, animationName, ui;
        this.parent();
        if (!me.state.isCurrent('ship-building') ||
            !me.state.current().isReset) {
            return;
        }
        ui = me.state.current();
        wallsAround = [];
        x = this.x;
        y = this.y;
        top = ui.mapAt(x, y - 1);
        left = ui.mapAt(x - 1, y);
        bot = ui.mapAt(x, y + 1);
        right = ui.mapAt(x + 1, y);
        if (top !== null && (top.type === 'wall' ||
            (top.type === 'door' && top.rotated() && top.y === y - 2))) {
            wallsAround.push('t');
        }
        if (left !== null && (left.type === 'wall' ||
            (left.type === 'door' && !left.rotated() && left.x === x - 2))) {
            wallsAround.push('l');
        }
        if (bot !== null && (bot.type === 'wall' ||
            (bot.type === 'door' && bot.rotated() && bot.y === y + 1))) {
            wallsAround.push('b');
        }
        if (right !== null && (right.type === 'wall' ||
            (right.type === 'door' && !right.rotated() &&
            right.x === x + 1))) {
            wallsAround.push('r');
        }
        if (wallsAround.length === 0) {
            this.setCurrentAnimation('lrWall'); //default
            return;
        }
        if (wallsAround.length === 1) { //just one connection
            if (wallsAround[0] === 't' || wallsAround[0] === 'b') {
                this.setCurrentAnimation('tbWall');
                return;
            }
            if (wallsAround[0] === 'l' || wallsAround[0] === 'r') {
                this.setCurrentAnimation('lrWall');
                return;
            }
        }
        wallsAround.push('Wall');
        animationName = wallsAround.join('');
        this.setCurrentAnimation(animationName);
    },
    update: function() {
        'use strict';
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
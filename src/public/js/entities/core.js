/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, charMap, pr, TILE_SIZE*/

/* An object that has tile position (x and y),
    and row length and col length through "size"
*/
var TileEntity = me.ObjectEntity.extend({
    _x: 0, //column
    _y: 0, //row
    size: [1, 1],
    cannonTile: [0, 0], //image offset
    init: function(x, y, settings) {
        'use strict';
        if (this.type !== 0) {
            settings.image = this.type;
        }
        if (!this.totalSize) {
            this.totalSize = [this.size[0], this.size[1]];
        }
        settings.spritewidth = this.totalSize[0] * TILE_SIZE;
        settings.spriteheight = this.totalSize[1] * TILE_SIZE;
        this.parent(x, y, settings);
        //restore type reset on this.parent()
        this.type = settings.image;
        this.x(x);
        this.y(y);
    },
    x: function(x) { //sets or gets the column at which it is located
        'use strict';
        if (x === undefined) {
            return this._x;
        }
        if (x === this._x) {
            return this;
        }
        if (!this.hidden()) {
            this.pos.x = (x - this.cannonTile[0]) * TILE_SIZE;
        }
        this._x = x;
        this.onPositionChange();
        return this;
    },
    y: function(y) { //sets or gets the row
        'use strict';
        if (y === undefined) {
            return this._y;
        }
        if (y === this._y) {
            return this;
        }
        if (!this.hidden()) {
            this.pos.y = (y - this.cannonTile[1]) * TILE_SIZE;
        }
        this._y = y;
        this.onPositionChange();
        return this;
    },
    _hidden: false,
    hidden: function(hide) {
        'use strict';
        if (hide === undefined) {
            return this._hidden;
        }
        if (hide) {
            this.pos.x = -400;
            this.pos.y = 0;
        } else {
            this.pos.x = this._x * TILE_SIZE;
            this.pos.y = this._y * TILE_SIZE;
        }
        this._hidden = hide;
        return this;
    },
    show: function() {
        'use strict';
        this.hidden(false);
        return this;
    },
    hide: function() {
        'use strict';
        this.hidden(true);
        return this;
    },
    onPositionChange: function() {
        'use strict';
        //it's abstract; does nothing
    },
    zIndex: 100
});


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
        this.placementRules.push(pr.make.spaceRule(charMap.codes._cleared,
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
    //returns true is some part of the item is occupying the tile
    occupies: function(x, y) {
        'use strict';
        var occupies = false;
        utils.itemTiles(this, function(tX, tY) {
            if (x === tX && y === tY) {
                occupies = true;
            }
        });
        return occupies;
    },
    //onBuilt is called only when the user himself builds it
    onBuilt: function() {
        'use strict';
        if (!me.state.isCurrent(me.state.BUILD)) {
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

    tiles: function() {
        'use strict';
        var tiles = [];
        utils.matrixTiles(this.trueSize(0), this.trueSize(1), function(x, y) {
            tiles.push({ x: x, y: y });
        });
        return tiles;
    }
});


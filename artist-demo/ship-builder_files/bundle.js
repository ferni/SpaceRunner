(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/

var gs = require('./game-state'),
    TILE_SIZE = gs.TILE_SIZE,
    HALF_TILE = gs.HALF_TILE;

/**
 * Draws stuff on the canvas based on canvas' primitives
 * @type {{}}
 */
var draw = module.exports = (function() {
    'use strict';
    var lineDashOffset = 1000;
    setInterval(function() {
        lineDashOffset--;
        if (lineDashOffset === 0) {
            lineDashOffset = 1000;
        }
    }, 64);
    return {
        tileHighlight: function(ctx, pos, color, thickness) {
            var pixelPos = {x: pos.x * TILE_SIZE,
                y: pos.y * TILE_SIZE};
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.moveTo(pixelPos.x, pixelPos.y);
            ctx.strokeRect(pixelPos.x, pixelPos.y, TILE_SIZE, TILE_SIZE);
        },
        circle: function(ctx, position, size, color) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc((position.x * TILE_SIZE) + HALF_TILE,
                (position.y * TILE_SIZE) + HALF_TILE,
                size, 0, Math.PI * 2, false);
            ctx.fill();
        },
        line: function(ctx, from, to, color, thickness) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        },
        getLineDashOffset: function() {
            return lineDashOffset;
        }
    };
}());

},{"./game-state":2}],2:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module*/

var gs = module.exports = {
    //sh.Player
    player: null,
    //sh.Ship
    ship: null,
    //selected TileEntityVMs at a given moment.
    selected: [],
    TILE_SIZE: 32,
    HALF_TILE: 16
};

},{}],3:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, me*/

var _ = require('underscore'),
    PF = require('pathfinding'),
    sh = require('shared'),
    TileEntityVM = require('./tile-entity-vm'),
    draw = require('./draw');

/**
 * A melonJS object used to represent an sh.Item on screen.
 * @type {*}
 */
var ItemVM = TileEntityVM.extend({
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
    },

    updateAnimation: function() {
        'use strict';
        var anim;
        if (this._onShip) {
            if (this.m.rotated()) {
                anim = this.onShipAnimations.rotated;
            } else {
                anim = this.onShipAnimations.normal;
            }
        } else {
            if (this.m.rotated()) {
                anim = this.offShipAnimations.rotated;
            } else {
                anim = this.offShipAnimations.normal;
            }
        }
        if (anim) {
            this.setCurrentAnimation(anim);
        }
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return this.m.canBuildAt(x, y, ship);
    },
    canBuildRotated: function(x, y, ship) {
        'use strict';
        return this.m.canBuildRotated(x, y, ship);
    },
    rotated: function(rotated) {
        'use strict';
        var prev = this.m.rotated();
        if (rotated === undefined) {
            return this.m.rotated();
        }
        if (rotated) {
            this.angle = Math.PI / 2;
        } else {
            this.angle = 0;
        }
        this.m.rotated(rotated);
        if (prev !== this.m.rotated()) {
            this.updateAnimation();
        }
        return this;
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        return this.m.trueSize(index);
    },
    //callback must have x and y. withinSize is optional
    tiles: function(callback, withinSize) {
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
    //onBuilt is called only when the user himself builds it
    onBuilt: function() {
        'use strict';
        if (!me.state.isCurrent('ship-building')) {
            console.error('item.onBuilt called when not building the ship');
        }
        //abstract method
    },
    temp: {}, //for storing temporary stuff (the wall uses this)
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
        return '';//for jsLint
    },
    whenOffShip: function() {
        'use strict';
        return '';//for jsLint
    },
    toJson: function() {
        'use strict';
        var self = this;
        return {
            type: self.type,
            x: self.x,
            y: self.y,
            rotated: self.rotated(),
            settings: {}
        };
    }
});

var itemVMs = {};


/*
    In each item, set size and type before calling parent()
*/

/**
 * Weapon view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Weapon = ItemVM.extend({
    // init function
    init: function(weaponModel) {
        'use strict';
        this.type = 'Weapon';
        this.size = weaponModel.size;
        this.totalSize = [3 * sh.GRID_SUB, 2 * sh.GRID_SUB];
        this.m = weaponModel;
        this.parent(weaponModel.x, weaponModel.y, {});
        this.onShip(weaponModel.onShip());
        this.fireOffset = {x: 64, y: 32};
    },
    update: function() {
        'use strict';
        if (this.firing) {
            this.shotX += 32;
            return true;
        }
        if (this.shotX > 200) {
            this.firing = false;
            return true;
        }
        return this.parent();
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        var fireFrom = sh.v.add(this.pos, this.fireOffset),
            laserLength = this.shotX - fireFrom.x;
        if (laserLength > 100) {
            laserLength = 100;
        }
        if (this.firing) {
            ctx.save();
            draw.line(ctx, {x: this.shotX, y: fireFrom.y},
                {x: this.shotX - laserLength, y: fireFrom.y}, '#2326D9', 20);
            ctx.restore();
        }
    },
    playFire: function() {
        'use strict';
        this.firing = true;
        this.shotX = this.pos.x + this.fireOffset.x;
    }
});

/**
 * Engine view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Engine = ItemVM.extend({
    // init function
    init: function(EngineModel) {
        'use strict';
        this.type = 'Engine';
        this.size = EngineModel.size;
        this.totalSize = [3 * sh.GRID_SUB, 2 * sh.GRID_SUB];
        this.cannonTile = [sh.GRID_SUB, 0];
        this.m = EngineModel;
        this.parent(EngineModel.x, EngineModel.y, {});
        this.onShip(EngineModel.onShip());
    }
});


/**
 * Power view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Power = ItemVM.extend({
    // init function
    init: function(powerModel) {
        'use strict';
        this.type = 'Power';
        this.size = powerModel.size;
        this.m = powerModel;
        this.parent(powerModel.x, powerModel.y, {});
        this.onShip(powerModel.onShip());
    }
});

/**
 * Console view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Console = ItemVM.extend({
    // init function
    init: function(consoleModel) {
        'use strict';
        this.type = 'Console';
        this.size = consoleModel.size;
        this.m = consoleModel;
        this.parent(consoleModel.x, consoleModel.y, {});
        this.onShip(consoleModel.onShip());
    }
});

/**
 * Component view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Component = ItemVM.extend({
    // init function
    init: function(componentModel) {
        'use strict';
        this.type = 'Component';
        this.size = componentModel.size;
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
        this.onShip(componentModel.onShip());

    }
});

/**
 * Door view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Door = ItemVM.extend({
    // init function
    init: function(doorModel) {
        'use strict';
        this.type = 'Door';
        this.size = doorModel.size;
        this.m = doorModel;
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
        this.rotated(this.m.rotated()); //force change angle
        this.zIndex = 110;
        this.onShip(doorModel.onShip());

    }

});

/**
 * Wall view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Wall = ItemVM.extend({
    // init function
    init: function(wallModel) {
        'use strict';
        this.type = 'Wall';
        this.size = wallModel.size;
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
        this.onShip(wallModel.onShip());
    },
    /**
     * Returns the model of the object if it's a viewmodel,
     * or returns the object itself if it's a model.
     * @param {*} object
     * @return {sh.Item}
     */
    getModel: function(object) {
        'use strict';
        if (object instanceof sh.Item) {
            return object;
        }
        if (object instanceof ItemVM) {
            return object.m;
        }
        return null;
    },
    updateAnimation: function() {
        'use strict';
        var screen = me.state.current(),
            top = screen.at(this.x, this.y - sh.GRID_SUB),
            left = screen.at(this.x - sh.GRID_SUB, this.y),
            bot = screen.at(this.x, this.y + sh.GRID_SUB),
            right = screen.at(this.x + sh.GRID_SUB, this.y),
            wallsAround = [],
            animationName;
        top = this.getModel(top);
        left = this.getModel(left);
        bot = this.getModel(bot);
        right = this.getModel(right);
        this.m.updateConnections(top, left, bot, right);
        if (this.m.isHorizontal()) {
            this.setCurrentAnimation('lr');
            return;
        }
        if (this.m.isVertical()) {
            this.setCurrentAnimation('tb');
            return;
        }
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
        animationName = wallsAround.join('');
        this.setCurrentAnimation(animationName);
    },
    onBuilt: function() {
        'use strict';
        var pfMatrix, t, ui, ship, size;
        this.parent();
        ui = me.state.current();
        ship = this.m.ship;
        size = {
            width: ship.width / sh.GRID_SUB,
            height: ship.height / sh.GRID_SUB
        };
        if (ui.mouseLockedOn === this) {
            return;
        }
        pfMatrix = sh.utils.getEmptyMatrix(size.width, size.height, 1);
        //self tile will be walkable for pathfinding purposes
        pfMatrix[this.y / sh.GRID_SUB][this.x / sh.GRID_SUB] = 0;
        _.each(pfMatrix, function(row, y) {
            _.each(pfMatrix, function(tile, x) {
                if (ship.hullMap[y][x] === sh.tiles.clear) {
                    pfMatrix[y][x] = 0;
                }
            });
        });
        this.alpha = 0.8;
        if (ui.chosen) {
            ui.chosen.hide();
        }
        t = this.temp;
        t.grid = new PF.Grid(size.width, size.height, pfMatrix);
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
        var t, clonedGrid, ui;
        ui = me.state.current();
        t = this.temp;

        if (mouseTile.x === t.preMouseX && mouseTile.y === t.preMouseY) {
            return;
        }
        t.preMouseX = mouseTile.x;
        t.preMouseY = mouseTile.y;
        ui.clear();
        if (mouseTile.x === t.pivotX && mouseTile.y === t.pivotY) {
            t.path = null;
            return;
        }
        clonedGrid = t.grid.clone();
        t.path = t.finder.findPath(t.pivotX / sh.GRID_SUB, t.pivotY /
            sh.GRID_SUB, mouseTile.x / sh.GRID_SUB, mouseTile.y / sh.GRID_SUB,
            clonedGrid);
        _.each(t.path, function(p, index) {
            if (index > 0) {
                ui.drawItem(p[0] * sh.GRID_SUB, p[1] * sh.GRID_SUB, 'Wall');
            }
        });
    },
    lockedMouseUp: function() {
        'use strict';
        var ui = me.state.current();
        _.each(ui.drawingScreen, function(wall) {
            ui.ship.buildAt(wall.x, wall.y, 'Wall');
        });
        this.alpha = 1;
        if (ui.chosen) {
            ui.chosen.alpha = 0.8;
        }
        this.temp = {};
        ui.clear();
        ui.mouseLockedOn = null;
    },
    lockedMouseDown: function() {
        'use strict';
        return 0;
    },
    lockedEscape: function() {
        'use strict';
        var ui = me.state.current();
        ui.clear();
        if (ui.chosen) {
            ui.chosen.alpha = 0.8;
        }
        this.temp = {};
        ui.mouseLockedOn = null;
        ui.ship.remove(this.m);
    }
});

/**
 * WeakSpot view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.WeakSpot = ItemVM.extend({
    // init function
    init: function(consoleModel) {
        'use strict';
        this.type = 'WeakSpot';
        this.size = consoleModel.size;
        this.m = consoleModel;
        this.parent(consoleModel.x, consoleModel.y, {});
        this.onShip(consoleModel.onShip());
        //this.setTransparency('A17FFF');
        this.alpha = 0.75;
    }
});

/**
 * Teleporter view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.Teleporter = ItemVM.extend({
    // init function
    init: function(model) {
        'use strict';
        this.type = 'Teleporter';
        this.size = model.size;
        this.m = model;
        this.parent(model.x, model.y, {});
        this.onShip(model.onShip());
    }
});

exports.ItemVM = ItemVM;
exports.itemVMs = itemVMs;
},{"./draw":1,"./tile-entity-vm":5,"pathfinding":8,"shared":38,"underscore":41}],4:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

me.plugin.patch(me.TMXTileMap, 'load', function() {
    'use strict';
    this.parent();
    this.mapLayers.push(new me.ColorLayer('background_color', '#000000',
        this.z - 10));
});

/**
 * Disable MelonJS pause function for when focus is away.
 * @return {int}
 */
me.state.pause = function() {
    'use strict';
    return 0;
};

/**
 * Disable MelonJS resume function.
 * @return {int}
 */
me.state.resume = function() {
    'use strict';
    return 0;
};


},{}],5:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me*/

var _ = require('underscore')._,
    utils = require('./utils'),
    gs = require('./game-state'),
    TILE_SIZE = gs.TILE_SIZE,
    sh = require('shared');

/* An object that has tile position (x and y),
 and row length and col length through "size"
 */
var TileEntityVM = module.exports = me.ObjectEntity.extend({
    x: 0, //column
    y: 0, //row
    size: [1, 1],
    cannonTile: [0, 0], //image offset
    isSelectable: false,
    init: function(x, y, settings) {
        'use strict';
        var type, selected = false;
        this.screen = me.state.current();
        if (this.type !== 0) {
            type = this.type;
            settings.image = this.type.toLowerCase();
        }
        if (!this.totalSize) {
            this.totalSize = [this.size[0], this.size[1]];
        }
        if (settings.spritewidth === undefined) {
            settings.spritewidth = this.totalSize[0] * TILE_SIZE;
        }
        if (settings.spriteheight === undefined) {
            settings.spriteheight = this.totalSize[1] * TILE_SIZE;
        }
        this.parent(x, y, settings);
        //restore type reset on this.parent()
        this.type = type;
        this.setX(x);
        this.setY(y);

        me.input.registerMouseEvent('mousedown', this,
            this.onMouseDown.bind(this));
        me.input.registerMouseEvent('mouseup', this,
            this.onMouseUp.bind(this));

        if (!this.selectionColor) {
            this.selectionColor = 'teal';
        }
        this.selected = function() {
            return selected;
        };
        this.select = function() {
            selected = true;
            if (!_.contains(gs.selected, this)) {
                gs.selected.push(this);
            }
            this.onSelected();
        };
        this.deselect = function() {
            selected = false;
            sh.utils.removeFromArray(this, gs.selected);
            this.onDeselected();
        };
    },
    update: function() {
        'use strict';
        this.parent();
        if (this.isSelectable && this.isMouseOver) {
            utils.setCursor('pointer');
        }
        if (this.occupies(utils.lastMouse)) {
            if (!this.isMouseOver) {
                this.onMouseEnter();
                this.isMouseOver = true;
            }
        } else {
            if (this.isMouseOver) {
                this.onMouseLeave();
                this.isMouseOver = false;
            }
        }
        return true;
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        if (this.isSelectable) {
            if (this.selected()) {
                this.drawSelectedHightlight(ctx);
            } else if (this.isMouseOver) {
                this.drawHoverHighlight(ctx);
            }
        }
    },
    drawHoverHighlight: function(ctx) {
        'use strict';
        ctx.strokeStyle = this.selectionColor;
        ctx.lineWidth = 1;
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.strokeRect(this.pos.x, this.pos.y, this.width,
            this.height);
    },
    drawSelectedHightlight: function(ctx) {
        'use strict';
        ctx.strokeStyle = this.selectionColor;
        ctx.lineWidth = 2;
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.strokeRect(this.pos.x, this.pos.y, this.width,
            this.height);
    },
    onMouseDown: function() {
        'use strict';
        return '';//for jsLint
    },
    onMouseUp: function() {
        'use strict';
        if (this.isSelectable) {
            this.select();
        }
    },
    onMouseEnter: function() {
        'use strict';
        return '';//for jsLint
    },
    onMouseLeave: function() {
        'use strict';
        if (this.isSelectable) {
            utils.setCursor('default');
        }
    },
    onSelected: function() {
        'use strict';
        return '';//for jsLint
    },
    onDeselected: function() {
        'use strict';
        return '';//for jsLint
    },
    setX: function(x) { //sets the column at which it is located
        'use strict';
        if (x === this.x) {
            return this;
        }
        this.x = x;
        this.pos.x = (this.x - this.cannonTile[0]) * TILE_SIZE;
        return this;
    },
    setY: function(y) { //sets the row
        'use strict';
        if (y === this.y) {
            return this;
        }
        this.y = y;
        this.pos.y = (this.y - this.cannonTile[1]) * TILE_SIZE;
        return this;
    },
    _hidden: false,
    hidden: function(hide) {
        'use strict';
        if (hide === undefined) {
            return this._hidden;
        }
        if (hide) {
            this.alpha = 0;
        } else {
            this.alpha = 1;
        }
        this._hidden = hide;
        return this;
    },
    show: function() {
        'use strict';
        this.hidden(false);
        if (this.wasSelectable) {
            this.isSelectable = true;
        }
        return this;
    },
    hide: function() {
        'use strict';
        this.hidden(true);
        if (this.isSelectable) {
            if (this.selected()) {
                this.deselect();
            }
            this.wasSelectable = true;
            this.isSelectable = false;
        }
        return this;
    },
    trueSize: function(index) {
        'use strict';
        //(only items can rotate, not units)
        return this.size[index];
    },
    occupies: function(tile) {
        'use strict';
        var x = tile.x, y = tile.y;
        return x >= this.x && x < this.x + this.trueSize(0) &&
            y >= this.y && y < this.y + this.trueSize(1);
    },
    /**
     * Choose which properties would be tracked to
     * be stored in 'changed'.
     * @param {Array} properties
     */
    setTracked: function(properties) {
        'use strict';
        this.prevModelState = {};
        _.each(properties, function(p) {
            this.prevModelState[p] = this.m[p];
        }, this);
    },
    notifyModelChange: function() {
        'use strict';
        var self = this,
            changed = {};
        _.each(this.prevModelState, function(value, propName) {
            if (self.m[propName] !== value) {
                changed[propName] = {previous: self.prevModelState[propName]};
                //update previous model state
                self.prevModelState[propName] = self.m[propName];
            }
        });
        if (_.size(changed) > 0) {
            this.onModelChanged(changed);
        }
    },
    onModelChanged: function(changed) {
        'use strict';
        //(override this function)
        return changed;
    },
    /**
     * OnDestroy notification function<br>
     * Called by engine before deleting the object<br>
     * be sure to call the parent function if overwritten
     */
    onDestroyEvent: function() {
        'use strict';
        this.parent();
        me.input.releaseMouseEvent('mousedown', this);
        me.input.releaseMouseEvent('mouseup', this);
    }
});

},{"./game-state":2,"./utils":7,"shared":38,"underscore":41}],6:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me*/

var TileEntityVM = require('./tile-entity-vm'),
    _ = require('underscore');

var ui = module.exports = (function() {
    'use strict';
    var ui = {};
    /**
     * A transparent red overlay.
     * @type {*}
     */
    ui.RedColorEntity = TileEntityVM.extend({
        init: function(x, y) {
            this.size = [1, 1];
            this.parent(x, y, {
                image: 'selector',
                name: 'red'
            });
        }
    });

    /**
     * Makes the object fade a little. (Use on objects' update to
     * make it fade until it disappears).
     * @param {*} object The object to fade.
     * @param {{duration:int, step:float}} settings
     */
    function fade(object, settings) {
        settings = _.defaults(settings || {}, {duration: 30, step: 0.03});
        if (object.fadeCountdown === undefined) {
            object.fadeCountdown = settings.duration;
        }
        object.alpha -= settings.step;
        object.fadeCountdown--;
        if (object.fadeCountdown === 0) {
            me.game.remove(object);
        }
    }

    ui.ShipDamageOverlay = me.ObjectEntity.extend({
        init: function() {
            //the pivot doesn't move
            this.parent(0, 0, {image: 'nothing'});
            this.alpha = 0.5;
        },
        draw: function(ctx) {
            this.parent(ctx);
            ctx.save();
            ctx.fillStyle = 'red';
            ctx.globalAlpha = this.alpha;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        },
        update: function() {
            this.parent();
            fade(this, {duration: 10});
        }
    });
    /**
     * A drag-box to select units.
     * @type {*}
     */
    ui.DragBox = me.Rect.extend({
        /**
         *
         * @param {me.Vector2d} pivot The pivot position.
         */
        init: function(pivot) {
            //the pivot doesn't move
            this.piv = pivot;
            this.parent(new me.Vector2d(pivot.x, pivot.y), 1, 1);
        },
        draw: function(ctx) {
            this.parent(ctx);
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        },
        updateFromMouse: function(mouse) {
            if (mouse.x > this.piv.x) {
                this.width = mouse.x - this.piv.x;
            } else {
                //the width must not have negative values or
                //else the 'contains' method would not work
                this.pos.x = mouse.x;
                this.width = this.piv.x - mouse.x;
            }

            if (mouse.y > this.piv.y) {
                this.height = mouse.y - this.piv.y;
            } else {
                //the height must not have negative values or
                //else the 'contains' method would not work
                this.pos.y = mouse.y;
                this.height = this.piv.y - mouse.y;
            }
        }
    });

    /**
     * A little star that shows up when a melee hit occurs.
     * @type {*}
     */
    ui.StarHit = me.ObjectEntity.extend({
        init: function(unitVM) {
            this.parent(unitVM.pos.x - 8, unitVM.pos.y - 8,
                {image: 'star_hit_white', spritewidth: 16, spriteheight: 16,
                    name: 'star_hit'});
        },
        update: function() {
            this.parent();
            fade(this);
        }
    });


    /**
     * A number that floats upwards.
     * @type {*}
     */
    ui.FloatingNumber = me.ObjectEntity.extend({
        fontObject: null,
        init: function(pos, value) {
            var color;
            this.parent(pos.x, pos.y, {image: 'nothing'});
            this.pos = pos;
            this.verticalOffset = 0;
            this.value = value;
            color = value < 0 ? 'red' : 'green';
            this.fontObject = new me.Font('Lucida Console', 14, color);
            //this.fontObject.bold();

        },
        draw: function(context) {
            this.parent(context);
            context.save();
            context.globalAlpha = this.alpha;
            this.fontObject.draw(me.video.getScreenContext(),
                this.value, this.pos.x, this.pos.y + this.verticalOffset);
            context.restore();
        },
        update: function() {
            this.parent();
            this.verticalOffset -= 0.3;//goes up a little.
            fade(this);
        }
    });

    /**
     * A button with text.
     * @type {*}
     */
    ui.Button = me.GUI_Object.extend({
        fontObject: null,
        text: '',
        init: function(text, x, y, settings) {
            if (!settings) {
                settings = {};
            }
            if (!settings.image) {
                settings.image = 'button';
            }
            if (!settings.name) {
                settings.name = 'button';
            }
            this.parent(x, y, settings);
            this.text = text;
            this.setTransparency('#FFFFFF');
            this.fontObject = new me.Font('Arial', 16, 'white');
            this.fontObject.bold();

        },
        draw: function(context) {
            this.parent(context);
            this.fontObject.draw(me.video.getScreenContext(),
                this.text, this.pos.x + 20, this.pos.y + 24);
        }/*,
        onClick: function() {
        }*/
    });

    ui.ChargingWeaponIcon = me.ObjectEntity.extend({
        init: function(unitVM) {
            this.parent(unitVM.pos.x - 8, unitVM.pos.y - 8, {
                image: 'charging-weapon-icon',
                spritewidth: 16,
                spriteheight: 16
            });
            this.alpha = 0.8;
        }
    });

    //for the z index
    ui.layers = {
        items: 10,
        colorOverlay: 20,
        units: 30,
        effects: 40,
        indicators: 50
    };
    return ui;
}());


},{"./tile-entity-vm":5,"underscore":41}],7:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me, _, TILE_SIZE*/
var sh = require('shared'),
    gs = require('./game-state');

var utils = module.exports = {
    getParameterByName: function(name) {
        'use strict';
        var match = new RegExp('[?&]' + name + '=([^&]*)')
            .exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },
    toTileVector: function(vector2D, tileSize) {
        'use strict';
        var v = new me.Vector2d();
        v.x = Math.floor(vector2D.x / tileSize);
        v.y = Math.floor(vector2D.y / tileSize);
        return v;
    },
    //returns the tile position of the mouse
    getMouse: function() {
        'use strict';
        var tile = utils.toTileVector(utils.getMousePx(), gs.TILE_SIZE);
        this.lastMouse = tile;
        return tile;
    },
    getMousePx: function() {
        'use strict';
        if (!me.game.currentLevel.initialized) {
            throw "There's no level to get the mouse";
        }
        var pxPos = sh.v.sub(me.input.mouse.pos, me.game.currentLevel.pos);
        this.lastMousePx = pxPos;
        return pxPos;
    },
    setCursor: function(cursor) {
        'use strict';
        if (cursor !== this.currentCursor) {
            document.getElementById('jsapp').style.cursor = cursor;
            this.currentCursor = cursor;
        }
    },
    isMine: function(object) {
        'use strict';
        var ownerID = object.ownerID;
        if (ownerID === undefined) {
            ownerID = object.owner.id;
        }
        return gs.player.id === ownerID;
    },
    isEnemy: function(object) {
        'use strict';
        return !utils.isMine(object);
    },
    /**
     * Returns a new view model according to the model's type.
     * @param {Object} model
     * @param {Function} DefaultConstructor
     * @param {Object} vmConstructors
     * @return {Object}
     */
    makeVM: function(model, DefaultConstructor, vmConstructors) {
        'use strict';
        if (!vmConstructors) {
            vmConstructors = {};
        }
        if (vmConstructors[model.type]) {
            return new vmConstructors[model.type](model);
        }
        return new DefaultConstructor(model);
    },
    /**
     * Adds or removes VMs from MelonJS engine
     * and from the vms array, so it matches the models array.
     * @param {{models:Array, vms:Array, zIndex:int, addToGame:bool,
     * vmConstructors:Object, DefaultConstructor:Function,
     * makeVM: Function}} params
     * @return {boolean}
     */
    updateVMs: function(params) {
        'use strict';
        var i, v, hasVM, aux, somethingChanged = false,
            models = params.models,
            vms = params.vms,
            zIndex = params.zIndex,
            addToGame = params.addToGame,
            //can override default function
            makeVM = params.makeVM || function(model) {
                return utils.makeVM(model, params.DefaultConstructor,
                    params.vmConstructors);
            };
        if (zIndex === undefined) {
            zIndex = 100;
        }
        if (addToGame === undefined) {
            addToGame = true;
        }
        for (i = 0; i < models.length; i++) {
            hasVM = false;
            for (v = i; v < vms.length; v++) {
                if (models[i] === vms[v].m) {
                    hasVM = true;
                    break;
                }
            }
            if (hasVM) {
                //put vm at item's index position
                if (v !== i) {
                    aux = vms[v];
                    vms[v] = vms[i];
                    vms[i] = aux;
                }
            } else {
                //new vm
                vms.splice(i, 0, makeVM(models[i]));
                if (addToGame) {
                    me.game.add(vms[i], zIndex);
                }
                somethingChanged = true;
            }
        }
        //remove extra vms
        for (v = models.length; v < vms.length; v++) {
            if (addToGame) {
                me.game.remove(vms[v], true);
            }
            somethingChanged = true;
        }
        vms.splice(models.length, vms.length - models.length);
        return somethingChanged;
    },
    getVM: function(model, modelArray, vmArray) {
        'use strict';
        var index = modelArray.indexOf(model);
        if (index !== null && index !== undefined && vmArray[index] &&
                vmArray[index].m === model) {
            return vmArray[index];
        }
        throw 'Did not find the view model for ' + model.type +
            ' in the array. Try calling utils.updateVMs first.';
    }
};

/**
 * Last mouse tile got by utils.getMouse
 * @type {{x: number, y: number}}
 */
utils.lastMouse = {x: 0, y: 0};
/**
 * Last mouse pixel pos got by utils.getMousePx
 * @type {{x: number, y: number}}
 */
utils.lastMousePx = {x: 0, y: 0};


},{"./game-state":2,"shared":38}],8:[function(require,module,exports){
module.exports = require('./src/PathFinding');

},{"./src/PathFinding":9}],9:[function(require,module,exports){
module.exports = {
    'Node'                 : require('./core/Node'),
    'Grid'                 : require('./core/Grid'),
    'Heap'                 : require('./core/Heap'),
    'Util'                 : require('./core/Util'),
    'Heuristic'            : require('./core/Heuristic'),
    'AStarFinder'          : require('./finders/AStarFinder'),
    'BestFirstFinder'      : require('./finders/BestFirstFinder'),
    'BreadthFirstFinder'   : require('./finders/BreadthFirstFinder'),
    'DijkstraFinder'       : require('./finders/DijkstraFinder'),
    'BiAStarFinder'        : require('./finders/BiAStarFinder'),
    'BiBestFirstFinder'    : require('./finders/BiBestFirstFinder'),
    'BiBreadthFirstFinder' : require('./finders/BiBreadthFirstFinder'),
    'BiDijkstraFinder'     : require('./finders/BiDijkstraFinder'),
    'JumpPointFinder'      : require('./finders/JumpPointFinder')
};

},{"./core/Grid":10,"./core/Heap":11,"./core/Heuristic":12,"./core/Node":13,"./core/Util":14,"./finders/AStarFinder":15,"./finders/BestFirstFinder":16,"./finders/BiAStarFinder":17,"./finders/BiBestFirstFinder":18,"./finders/BiBreadthFirstFinder":19,"./finders/BiDijkstraFinder":20,"./finders/BreadthFirstFinder":21,"./finders/DijkstraFinder":22,"./finders/JumpPointFinder":23}],10:[function(require,module,exports){
var Node = require('./Node');

/**
 * The Grid class, which serves as the encapsulation of the layout of the nodes.
 * @constructor
 * @param {number} width Number of columns of the grid.
 * @param {number} height Number of rows of the grid.
 * @param {Array.<Array.<(number|boolean)>>} [matrix] - A 0-1 matrix
 *     representing the walkable status of the nodes(0 or false for walkable).
 *     If the matrix is not supplied, all the nodes will be walkable.  */
function Grid(width, height, matrix) {
    /**
     * The number of columns of the grid.
     * @type number
     */
    this.width = width;
    /**
     * The number of rows of the grid.
     * @type number
     */
    this.height = height;

    /**
     * A 2D array of nodes.
     */
    this.nodes = this._buildNodes(width, height, matrix);
}

/**
 * Build and return the nodes.
 * @private
 * @param {number} width
 * @param {number} height
 * @param {Array.<Array.<number|boolean>>} [matrix] - A 0-1 matrix representing
 *     the walkable status of the nodes.
 * @see Grid
 */
Grid.prototype._buildNodes = function(width, height, matrix) {
    var i, j,
        nodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        nodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            nodes[i][j] = new Node(j, i);
        }
    }


    if (matrix === undefined) {
        return nodes;
    }

    if (matrix.length !== height || matrix[0].length !== width) {
        throw new Error('Matrix size does not fit');
    }

    for (i = 0; i < height; ++i) {
        for (j = 0; j < width; ++j) {
            if (matrix[i][j]) {
                // 0, false, null will be walkable
                // while others will be un-walkable
                nodes[i][j].walkable = false;
            }
        }
    }

    return nodes;
};


Grid.prototype.getNodeAt = function(x, y) {
    return this.nodes[y][x];
};


/**
 * Determine whether the node at the given position is walkable.
 * (Also returns false if the position is outside the grid.)
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @return {boolean} - The walkability of the node.
 */
Grid.prototype.isWalkableAt = function(x, y) {
    return this.isInside(x, y) && this.nodes[y][x].walkable;
};


/**
 * Determine whether the position is inside the grid.
 * XXX: `grid.isInside(x, y)` is wierd to read.
 * It should be `(x, y) is inside grid`, but I failed to find a better
 * name for this method.
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Grid.prototype.isInside = function(x, y) {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
};


/**
 * Set whether the node on the given position is walkable.
 * NOTE: throws exception if the coordinate is not inside the grid.
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @param {boolean} walkable - Whether the position is walkable.
 */
Grid.prototype.setWalkableAt = function(x, y, walkable) {
    this.nodes[y][x].walkable = walkable;
};


/**
 * Get the neighbors of the given node.
 *
 *     offsets      diagonalOffsets:
 *  +---+---+---+    +---+---+---+
 *  |   | 0 |   |    | 0 |   | 1 |
 *  +---+---+---+    +---+---+---+
 *  | 3 |   | 1 |    |   |   |   |
 *  +---+---+---+    +---+---+---+
 *  |   | 2 |   |    | 3 |   | 2 |
 *  +---+---+---+    +---+---+---+
 *
 *  When allowDiagonal is true, if offsets[i] is valid, then
 *  diagonalOffsets[i] and
 *  diagonalOffsets[(i + 1) % 4] is valid.
 * @param {Node} node
 * @param {boolean} allowDiagonal
 * @param {boolean} dontCrossCorners
 */
Grid.prototype.getNeighbors = function(node, allowDiagonal, dontCrossCorners) {
    var x = node.x,
        y = node.y,
        neighbors = [],
        s0 = false, d0 = false,
        s1 = false, d1 = false,
        s2 = false, d2 = false,
        s3 = false, d3 = false,
        nodes = this.nodes;

    // ↑
    if (this.isWalkableAt(x, y - 1)) {
        neighbors.push(nodes[y - 1][x]);
        s0 = true;
    }
    // →
    if (this.isWalkableAt(x + 1, y)) {
        neighbors.push(nodes[y][x + 1]);
        s1 = true;
    }
    // ↓
    if (this.isWalkableAt(x, y + 1)) {
        neighbors.push(nodes[y + 1][x]);
        s2 = true;
    }
    // ←
    if (this.isWalkableAt(x - 1, y)) {
        neighbors.push(nodes[y][x - 1]);
        s3 = true;
    }

    if (!allowDiagonal) {
        return neighbors;
    }

    if (dontCrossCorners) {
        d0 = s3 && s0;
        d1 = s0 && s1;
        d2 = s1 && s2;
        d3 = s2 && s3;
    } else {
        d0 = s3 || s0;
        d1 = s0 || s1;
        d2 = s1 || s2;
        d3 = s2 || s3;
    }

    // ↖
    if (d0 && this.isWalkableAt(x - 1, y - 1)) {
        neighbors.push(nodes[y - 1][x - 1]);
    }
    // ↗
    if (d1 && this.isWalkableAt(x + 1, y - 1)) {
        neighbors.push(nodes[y - 1][x + 1]);
    }
    // ↘
    if (d2 && this.isWalkableAt(x + 1, y + 1)) {
        neighbors.push(nodes[y + 1][x + 1]);
    }
    // ↙
    if (d3 && this.isWalkableAt(x - 1, y + 1)) {
        neighbors.push(nodes[y + 1][x - 1]);
    }

    return neighbors;
};


/**
 * Get a clone of this grid.
 * @return {Grid} Cloned grid.
 */
Grid.prototype.clone = function() {
    var i, j,

        width = this.width,
        height = this.height,
        thisNodes = this.nodes,

        newGrid = new Grid(width, height),
        newNodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        newNodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            newNodes[i][j] = new Node(j, i, thisNodes[i][j].walkable);
        }
    }

    newGrid.nodes = newNodes;

    return newGrid;
};

module.exports = Grid;

},{"./Node":13}],11:[function(require,module,exports){
// From https://github.com/qiao/heap.js
// Generated by CoffeeScript 1.3.1
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;

  /* 
  Default comparison function to be used
  */


  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };

  /* 
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
  */


  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (cmp(lo, hi) < 0) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };

  /*
  Push item onto heap, maintaining the heap invariant.
  */


  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };

  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
  */


  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };

  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be 
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
  */


  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };

  /*
  Fast version of a heappush followed by a heappop.
  */


  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };

  /*
  Transform list into a heap, in-place, in O(array.length) time.
  */


  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };

  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
  */


  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };

  /*
  Find the n largest elements in a dataset.
  */


  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };

  /*
  Find the n smallest elements in a dataset.
  */


  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {

    Heap.name = 'Heap';

    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.remove = Heap.prototype.pop;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  if (typeof module !== "undefined" && module !== null ? module.exports : void 0) {
    module.exports = Heap;
  } else {
    window.Heap = Heap;
  }

}).call(this);

},{}],12:[function(require,module,exports){
/**
 * @namespace PF.Heuristic
 * @description A collection of heuristic functions.
 */
module.exports = {

  /**
   * Manhattan distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} dx + dy
   */
  manhattan: function(dx, dy) {
      return dx + dy;
  },

  /**
   * Euclidean distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} sqrt(dx * dx + dy * dy)
   */
  euclidean: function(dx, dy) {
      return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Chebyshev distance.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @return {number} max(dx, dy)
   */
  chebyshev: function(dx, dy) {
      return Math.max(dx, dy);
  }

};

},{}],13:[function(require,module,exports){
/**
 * A node in grid. 
 * This class holds some basic information about a node and custom 
 * attributes may be added, depending on the algorithms' needs.
 * @constructor
 * @param {number} x - The x coordinate of the node on the grid.
 * @param {number} y - The y coordinate of the node on the grid.
 * @param {boolean} [walkable] - Whether this node is walkable.
 */
function Node(x, y, walkable) {
    /**
     * The x coordinate of the node on the grid.
     * @type number
     */
    this.x = x;
    /**
     * The y coordinate of the node on the grid.
     * @type number
     */
    this.y = y;
    /**
     * Whether this node can be walked through.
     * @type boolean
     */
    this.walkable = (walkable === undefined ? true : walkable);
};

module.exports = Node;

},{}],14:[function(require,module,exports){
/**
 * Backtrace according to the parent records and return the path.
 * (including both start and end nodes)
 * @param {Node} node End node
 * @return {Array.<Array.<number>>} the path
 */
function backtrace(node) {
    var path = [[node.x, node.y]];
    while (node.parent) {
        node = node.parent;
        path.push([node.x, node.y]);
    }
    return path.reverse();
}
exports.backtrace = backtrace;

/**
 * Backtrace from start and end node, and return the path.
 * (including both start and end nodes)
 * @param {Node}
 * @param {Node}
 */
function biBacktrace(nodeA, nodeB) {
    var pathA = backtrace(nodeA),
        pathB = backtrace(nodeB);
    return pathA.concat(pathB.reverse());
}
exports.biBacktrace = biBacktrace;

/**
 * Compute the length of the path.
 * @param {Array.<Array.<number>>} path The path
 * @return {number} The length of the path
 */
function pathLength(path) {
    var i, sum = 0, a, b, dx, dy;
    for (i = 1; i < path.length; ++i) {
        a = path[i - 1];
        b = path[i];
        dx = a[0] - b[0];
        dy = a[1] - b[1];
        sum += Math.sqrt(dx * dx + dy * dy);
    }
    return sum;
}
exports.pathLength = pathLength;


/**
 * Given the start and end coordinates, return all the coordinates lying
 * on the line formed by these coordinates, based on Bresenham's algorithm.
 * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm#Simplification
 * @param {number} x0 Start x coordinate
 * @param {number} y0 Start y coordinate
 * @param {number} x1 End x coordinate
 * @param {number} y1 End y coordinate
 * @return {Array.<Array.<number>>} The coordinates on the line
 */
function getLine(x0, y0, x1, y1) {
    var abs = Math.abs,
        line = [],
        sx, sy, dx, dy, err, e2;

    dx = abs(x1 - x0);
    dy = abs(y1 - y0);

    sx = (x0 < x1) ? 1 : -1;
    sy = (y0 < y1) ? 1 : -1;

    err = dx - dy;

    while (true) {
        line.push([x0, y0]);

        if (x0 === x1 && y0 === y1) {
            break;
        }
        
        e2 = 2 * err;
        if (e2 > -dy) {
            err = err - dy;
            x0 = x0 + sx;
        }
        if (e2 < dx) {
            err = err + dx;
            y0 = y0 + sy;
        }
    }

    return line;
}
exports.getLine = getLine;


/**
 * Smoothen the give path.
 * The original path will not be modified; a new path will be returned.
 * @param {PF.Grid} grid
 * @param {Array.<Array.<number>>} path The path
 * @return {Array.<Array.<number>>} Smoothened path
 */
function smoothenPath(grid, path) {
    var len = path.length,
        x0 = path[0][0],        // path start x
        y0 = path[0][1],        // path start y
        x1 = path[len - 1][0],  // path end x
        y1 = path[len - 1][1],  // path end y
        sx, sy,                 // current start coordinate
        ex, ey,                 // current end coordinate
        lx, ly,                 // last valid end coordinate
        newPath,
        i, j, coord, line, testCoord, blocked;

    sx = x0;
    sy = y0;
    lx = path[1][0];
    ly = path[1][1];
    newPath = [[sx, sy]];

    for (i = 2; i < len; ++i) {
        coord = path[i];
        ex = coord[0];
        ey = coord[1];
        line = getLine(sx, sy, ex, ey);

        blocked = false;
        for (j = 1; j < line.length; ++j) {
            testCoord = line[j];

            if (!grid.isWalkableAt(testCoord[0], testCoord[1])) {
                blocked = true;
                newPath.push([lx, ly]);
                sx = lx;
                sy = ly;
                break;
            }
        }
        if (!blocked) {
            lx = ex;
            ly = ey;
        }
    }
    newPath.push([x1, y1]);

    return newPath;
}
exports.smoothenPath = smoothenPath;

},{}],15:[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, 
 *     in order to speed up the search.
 */
function AStarFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
AStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, ng;

    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        // if reached the end position, construct the path and return it
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    openList.push(neighbor);
                    neighbor.opened = true;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    openList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = AStarFinder;

},{"../core/Heap":11,"../core/Heuristic":12,"../core/Util":14}],16:[function(require,module,exports){
var AStarFinder = require('./AStarFinder');

/**
 * Best-First-Search path-finder.
 * @constructor
 * @extends AStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function BestFirstFinder(opt) {
    AStarFinder.call(this, opt);

    var orig = this.heuristic;
    this.heuristic = function(dx, dy) {
        return orig(dx, dy) * 1000000;
    };
};

BestFirstFinder.prototype = new AStarFinder();
BestFirstFinder.prototype.constructor = BestFirstFinder;

module.exports = BestFirstFinder;

},{"./AStarFinder":15}],17:[function(require,module,exports){
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * A* path-finder.
 * based upon https://github.com/bgrins/javascript-astar
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, 
 *     in order to speed up the search.
 */
function BiAStarFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BiAStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var cmp = function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        },
        startOpenList = new Heap(cmp),
        endOpenList = new Heap(cmp),
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        heuristic = this.heuristic,
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        weight = this.weight,
        abs = Math.abs, SQRT2 = Math.SQRT2,
        node, neighbors, neighbor, i, l, x, y, ng,
        BY_START = 1, BY_END = 2;

    // set the `g` and `f` value of the start node to be 0
    // and push it into the start open list
    startNode.g = 0;
    startNode.f = 0;
    startOpenList.push(startNode);
    startNode.opened = BY_START;

    // set the `g` and `f` value of the end node to be 0
    // and push it into the open open list
    endNode.g = 0;
    endNode.f = 0;
    endOpenList.push(endNode);
    endNode.opened = BY_END;

    // while both the open lists are not empty
    while (!startOpenList.empty() && !endOpenList.empty()) {

        // pop the position of start node which has the minimum `f` value.
        node = startOpenList.pop();
        node.closed = true;

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened === BY_END) {
                return Util.biBacktrace(node, neighbor);
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - endX), abs(y - endY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    startOpenList.push(neighbor);
                    neighbor.opened = BY_START;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    startOpenList.updateItem(neighbor);
                }
            }
        } // end for each neighbor


        // pop the position of end node which has the minimum `f` value.
        node = endOpenList.pop();
        node.closed = true;

        // get neigbours of the current node
        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened === BY_START) {
                return Util.biBacktrace(neighbor, node);
            }

            x = neighbor.x;
            y = neighbor.y;

            // get the distance between current node and the neighbor
            // and calculate the next g score
            ng = node.g + ((x - node.x === 0 || y - node.y === 0) ? 1 : SQRT2);

            // check if the neighbor has not been inspected yet, or
            // can be reached with smaller cost from the current node
            if (!neighbor.opened || ng < neighbor.g) {
                neighbor.g = ng;
                neighbor.h = neighbor.h || weight * heuristic(abs(x - startX), abs(y - startY));
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = node;

                if (!neighbor.opened) {
                    endOpenList.push(neighbor);
                    neighbor.opened = BY_END;
                } else {
                    // the neighbor can be reached with smaller cost.
                    // Since its f value has been updated, we have to
                    // update its position in the open list
                    endOpenList.updateItem(neighbor);
                }
            }
        } // end for each neighbor
    } // end while not open list empty

    // fail to find the path
    return [];
};

module.exports = BiAStarFinder;

},{"../core/Heap":11,"../core/Heuristic":12,"../core/Util":14}],18:[function(require,module,exports){
var BiAStarFinder = require('./BiAStarFinder');

/**
 * Bi-direcitional Best-First-Search path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function BiBestFirstFinder(opt) {
    BiAStarFinder.call(this, opt);

    var orig = this.heuristic;
    this.heuristic = function(dx, dy) {
        return orig(dx, dy) * 1000000;
    };
}

BiBestFirstFinder.prototype = new BiAStarFinder();
BiBestFirstFinder.prototype.constructor = BiBestFirstFinder;

module.exports = BiBestFirstFinder;

},{"./BiAStarFinder":17}],19:[function(require,module,exports){
var Util = require('../core/Util');

/**
 * Bi-directional Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BiBreadthFirstFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
}


/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BiBreadthFirstFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        startOpenList = [], endOpenList = [],
        neighbors, neighbor, node,
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        BY_START = 0, BY_END = 1,
        i, l;

    // push the start and end nodes into the queues
    startOpenList.push(startNode);
    startNode.opened = true;
    startNode.by = BY_START;

    endOpenList.push(endNode);
    endNode.opened = true;
    endNode.by = BY_END;

    // while both the queues are not empty
    while (startOpenList.length && endOpenList.length) {

        // expand start open list

        node = startOpenList.shift();
        node.closed = true;

        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened) {
                // if this node has been inspected by the reversed search,
                // then a path is found.
                if (neighbor.by === BY_END) {
                    return Util.biBacktrace(node, neighbor);
                }
                continue;
            }
            startOpenList.push(neighbor);
            neighbor.parent = node;
            neighbor.opened = true;
            neighbor.by = BY_START;
        }

        // expand end open list

        node = endOpenList.shift();
        node.closed = true;

        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            if (neighbor.closed) {
                continue;
            }
            if (neighbor.opened) {
                if (neighbor.by === BY_START) {
                    return Util.biBacktrace(neighbor, node);
                }
                continue;
            }
            endOpenList.push(neighbor);
            neighbor.parent = node;
            neighbor.opened = true;
            neighbor.by = BY_END;
        }
    }

    // fail to find the path
    return [];
};

module.exports = BiBreadthFirstFinder;

},{"../core/Util":14}],20:[function(require,module,exports){
var BiAStarFinder = require('./BiAStarFinder');

/**
 * Bi-directional Dijkstra path-finder.
 * @constructor
 * @extends BiAStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BiDijkstraFinder(opt) {
    BiAStarFinder.call(this, opt);
    this.heuristic = function(dx, dy) {
        return 0;
    };
}

BiDijkstraFinder.prototype = new BiAStarFinder();
BiDijkstraFinder.prototype.constructor = BiDijkstraFinder;

module.exports = BiDijkstraFinder;

},{"./BiAStarFinder":17}],21:[function(require,module,exports){
var Util = require('../core/Util');

/**
 * Breadth-First-Search path finder.
 * @constructor
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function BreadthFirstFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
}

/**
 * Find and return the the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
BreadthFirstFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = [],
        allowDiagonal = this.allowDiagonal,
        dontCrossCorners = this.dontCrossCorners,
        startNode = grid.getNodeAt(startX, startY),
        endNode = grid.getNodeAt(endX, endY),
        neighbors, neighbor, node, i, l;

    // push the start pos into the queue
    openList.push(startNode);
    startNode.opened = true;

    // while the queue is not empty
    while (openList.length) {
        // take the front node from the queue
        node = openList.shift();
        node.closed = true;

        // reached the end position
        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        neighbors = grid.getNeighbors(node, allowDiagonal, dontCrossCorners);
        for (i = 0, l = neighbors.length; i < l; ++i) {
            neighbor = neighbors[i];

            // skip this neighbor if it has been inspected before
            if (neighbor.closed || neighbor.opened) {
                continue;
            }

            openList.push(neighbor);
            neighbor.opened = true;
            neighbor.parent = node;
        }
    }
    
    // fail to find the path
    return [];
};

module.exports = BreadthFirstFinder;

},{"../core/Util":14}],22:[function(require,module,exports){
var AStarFinder = require('./AStarFinder');

/**
 * Dijkstra path-finder.
 * @constructor
 * @extends AStarFinder
 * @param {object} opt
 * @param {boolean} opt.allowDiagonal Whether diagonal movement is allowed.
 * @param {boolean} opt.dontCrossCorners Disallow diagonal movement touching block corners.
 */
function DijkstraFinder(opt) {
    AStarFinder.call(this, opt);
    this.heuristic = function(dx, dy) {
        return 0;
    };
}

DijkstraFinder.prototype = new AStarFinder();
DijkstraFinder.prototype.constructor = DijkstraFinder;

module.exports = DijkstraFinder;

},{"./AStarFinder":15}],23:[function(require,module,exports){
/**
 * @author aniero / https://github.com/aniero
 */
var Heap       = require('../core/Heap');
var Util       = require('../core/Util');
var Heuristic  = require('../core/Heuristic');

/**
 * Path finder using the Jump Point Search algorithm
 * @param {object} opt
 * @param {function} opt.heuristic Heuristic function to estimate the distance
 *     (defaults to manhattan).
 */
function JumpPointFinder(opt) {
    opt = opt || {};
    this.heuristic = opt.heuristic || Heuristic.manhattan;
}

/**
 * Find and return the path.
 * @return {Array.<[number, number]>} The path, including both start and
 *     end positions.
 */
JumpPointFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var openList = this.openList = new Heap(function(nodeA, nodeB) {
            return nodeA.f - nodeB.f;
        }),
        startNode = this.startNode = grid.getNodeAt(startX, startY),
        endNode = this.endNode = grid.getNodeAt(endX, endY), node;

    this.grid = grid;


    // set the `g` and `f` value of the start node to be 0
    startNode.g = 0;
    startNode.f = 0;

    // push the start node into the open list
    openList.push(startNode);
    startNode.opened = true;

    // while the open list is not empty
    while (!openList.empty()) {
        // pop the position of node which has the minimum `f` value.
        node = openList.pop();
        node.closed = true;

        if (node === endNode) {
            return Util.backtrace(endNode);
        }

        this._identifySuccessors(node);
    }

    // fail to find the path
    return [];
};

/**
 * Identify successors for the given node. Runs a jump point search in the
 * direction of each available neighbor, adding any points found to the open
 * list.
 * @protected
 */
JumpPointFinder.prototype._identifySuccessors = function(node) {
    var grid = this.grid,
        heuristic = this.heuristic,
        openList = this.openList,
        endX = this.endNode.x,
        endY = this.endNode.y,
        neighbors, neighbor,
        jumpPoint, i, l,
        x = node.x, y = node.y,
        jx, jy, dx, dy, d, ng, jumpNode,
        abs = Math.abs, max = Math.max;

    neighbors = this._findNeighbors(node);
    for(i = 0, l = neighbors.length; i < l; ++i) {
        neighbor = neighbors[i];
        jumpPoint = this._jump(neighbor[0], neighbor[1], x, y);
        if (jumpPoint) {

            jx = jumpPoint[0];
            jy = jumpPoint[1];
            jumpNode = grid.getNodeAt(jx, jy);

            if (jumpNode.closed) {
                continue;
            }

            // include distance, as parent may not be immediately adjacent:
            d = Heuristic.euclidean(abs(jx - x), abs(jy - y));
            ng = node.g + d; // next `g` value

            if (!jumpNode.opened || ng < jumpNode.g) {
                jumpNode.g = ng;
                jumpNode.h = jumpNode.h || heuristic(abs(jx - endX), abs(jy - endY));
                jumpNode.f = jumpNode.g + jumpNode.h;
                jumpNode.parent = node;

                if (!jumpNode.opened) {
                    openList.push(jumpNode);
                    jumpNode.opened = true;
                } else {
                    openList.updateItem(jumpNode);
                }
            }
        }
    }
};

/**
 Search recursively in the direction (parent -> child), stopping only when a
 * jump point is found.
 * @protected
 * @return {Array.<[number, number]>} The x, y coordinate of the jump point
 *     found, or null if not found
 */
JumpPointFinder.prototype._jump = function(x, y, px, py) {
    var grid = this.grid,
        dx = x - px, dy = y - py, jx, jy;

    if (!grid.isWalkableAt(x, y)) {
        return null;
    }
    else if (grid.getNodeAt(x, y) === this.endNode) {
        return [x, y];
    }

    // check for forced neighbors
    // along the diagonal
    if (dx !== 0 && dy !== 0) {
        if ((grid.isWalkableAt(x - dx, y + dy) && !grid.isWalkableAt(x - dx, y)) ||
            (grid.isWalkableAt(x + dx, y - dy) && !grid.isWalkableAt(x, y - dy))) {
            return [x, y];
        }
    }
    // horizontally/vertically
    else {
        if( dx !== 0 ) { // moving along x
            if((grid.isWalkableAt(x + dx, y + 1) && !grid.isWalkableAt(x, y + 1)) ||
               (grid.isWalkableAt(x + dx, y - 1) && !grid.isWalkableAt(x, y - 1))) {
                return [x, y];
            }
        }
        else {
            if((grid.isWalkableAt(x + 1, y + dy) && !grid.isWalkableAt(x + 1, y)) ||
               (grid.isWalkableAt(x - 1, y + dy) && !grid.isWalkableAt(x - 1, y))) {
                return [x, y];
            }
        }
    }

    // when moving diagonally, must check for vertical/horizontal jump points
    if (dx !== 0 && dy !== 0) {
        jx = this._jump(x + dx, y, x, y);
        jy = this._jump(x, y + dy, x, y);
        if (jx || jy) {
            return [x, y];
        }
    }

    // moving diagonally, must make sure one of the vertical/horizontal
    // neighbors is open to allow the path
    if (grid.isWalkableAt(x + dx, y) || grid.isWalkableAt(x, y + dy)) {
        return this._jump(x + dx, y + dy, x, y);
    } else {
        return null;
    }
};

/**
 * Find the neighbors for the given node. If the node has a parent,
 * prune the neighbors based on the jump point search algorithm, otherwise
 * return all available neighbors.
 * @return {Array.<[number, number]>} The neighbors found.
 */
JumpPointFinder.prototype._findNeighbors = function(node) {
    var parent = node.parent,
        x = node.x, y = node.y,
        grid = this.grid,
        px, py, nx, ny, dx, dy,
        neighbors = [], neighborNodes, neighborNode, i, l;

    // directed pruning: can ignore most neighbors, unless forced.
    if (parent) {
        px = parent.x;
        py = parent.y;
        // get the normalized direction of travel
        dx = (x - px) / Math.max(Math.abs(x - px), 1);
        dy = (y - py) / Math.max(Math.abs(y - py), 1);

        // search diagonally
        if (dx !== 0 && dy !== 0) {
            if (grid.isWalkableAt(x, y + dy)) {
                neighbors.push([x, y + dy]);
            }
            if (grid.isWalkableAt(x + dx, y)) {
                neighbors.push([x + dx, y]);
            }
            if (grid.isWalkableAt(x, y + dy) || grid.isWalkableAt(x + dx, y)) {
                neighbors.push([x + dx, y + dy]);
            }
            if (!grid.isWalkableAt(x - dx, y) && grid.isWalkableAt(x, y + dy)) {
                neighbors.push([x - dx, y + dy]);
            }
            if (!grid.isWalkableAt(x, y - dy) && grid.isWalkableAt(x + dx, y)) {
                neighbors.push([x + dx, y - dy]);
            }
        }
        // search horizontally/vertically
        else {
            if(dx === 0) {
                if (grid.isWalkableAt(x, y + dy)) {
                    if (grid.isWalkableAt(x, y + dy)) {
                        neighbors.push([x, y + dy]);
                    }
                    if (!grid.isWalkableAt(x + 1, y)) {
                        neighbors.push([x + 1, y + dy]);
                    }
                    if (!grid.isWalkableAt(x - 1, y)) {
                        neighbors.push([x - 1, y + dy]);
                    }
                }
            }
            else {
                if (grid.isWalkableAt(x + dx, y)) {
                    if (grid.isWalkableAt(x + dx, y)) {
                        neighbors.push([x + dx, y]);
                    }
                    if (!grid.isWalkableAt(x, y + 1)) {
                        neighbors.push([x + dx, y + 1]);
                    }
                    if (!grid.isWalkableAt(x, y - 1)) {
                        neighbors.push([x + dx, y - 1]);
                    }
                }
            }
        }
    }
    // return all neighbors
    else {
        neighborNodes = grid.getNeighbors(node, true);
        for (i = 0, l = neighborNodes.length; i < l; ++i) {
            neighborNode = neighborNodes[i];
            neighbors.push([neighborNode.x, neighborNode.y]);
        }
    }
    
    return neighbors;
};

module.exports = JumpPointFinder;

},{"../core/Heap":11,"../core/Heuristic":12,"../core/Util":14}],24:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = module.exports,
    _ = require('underscore')._,
    Jsonable = require('./jsonable').Jsonable,
    v = require('../general-stuff').v;

(function() {
    'use strict';
    var ModelChange;

    /**
     * A point in time in the Script in which a change in the model happens.
     * Each action has a modelChanges Array,
     * with the model changes made by that action.
     * @param {int} timeOffset The time in ms in which this change occurs,
     * relative to the action's time.
     * @param {Function} apply The function that would change stuff around.
     * @param {Action} action The action that originated the model change.
     * @param {Action} label The model change label. Useful to have to animate.
     * @constructor
     */
    ModelChange = function(timeOffset, apply, action, label) {
        this.type = 'ModelChange[' + action.type + ':' + label + ']';
        if (timeOffset < 0) {
            throw 'ModelChange timeOffset can\'t be negative';
        }
        this.timeOffset = timeOffset;
        this.label = label;
        this.apply = function(battle) {
            apply(battle);
        };
        this.action = action;
        this.updateTime();
    };
    ModelChange.prototype.updateTime = function() {
        this.time = this.action.time + this.timeOffset;
    };
    sh.ModelChange = ModelChange;

    /**
     * A point in time in the Script in which an action happens.
     * Whereas ModelChange represents a raw change in the model,
     * the action describes why those changes occurred.
     * Example:
     * If I have the action "Attack" , the change in the model from that attack
     * is that some unit loses health.
     * @type {*|extendShared}
     */
    sh.Action = Jsonable.extendShared({
        time: 0,//ms
        modelChanges: [],
        init: function(json) {
            this.setJson({
                type: 'Action',
                properties: ['time'],
                json: json
            });
        },
        /**
         * Sets the time updating the model changes;
         * @param {int} time
         */
        setTime: function(time) {
            this.time = time;
            _.invoke(this.modelChanges, 'updateTime');
        },
        /**
         * Set the action's model changes.
         * @param {Array.<{offset:int, label:string, changer:Function}>} changeArray
         * an array of changes.
         */
        setChanges: function(changeArray) {
            this.modelChanges = [];
            _.each(changeArray, function(c) {
                this.modelChanges.push(new ModelChange(c.offset,
                    c.changer, this, c.label));
            }, this);
        },
        toString: function() {
            return this.time + 'ms: ' + this.type;
        }
    });

    sh.actions = {};

    /**
     * The unit changes tiles.
     * @type {*}
     */
    sh.actions.Move = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Move',
                properties: ['unitID', 'from', 'to', 'duration'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        if (unit && unit.isAlive()) {
                            unit.moving = {
                                dest: self.to,
                                arrivalTime: self.time + self.duration
                            };
                            unit.blocking = false;
                            //cancel weapon charging
                            unit.cancelShipWeaponFire();
                        }
                    }
                },
                {
                    offset: self.duration,
                    label: 'arrive',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            prev;
                        if (unit && unit.isAlive() && !unit.teleported) {
                            prev = {x: unit.x, y: unit.y};
                            unit.y = self.to.y;
                            unit.x = self.to.x;
                            unit.moving = null;
                            unit.dizzy = true;//can't attack if just got there
                            unit.moveLock = null;
                            if (!v.equal(prev, self.to)) {
                                unit.ship.unitsMap.update();
                            }
                            //cancel weapon charging
                            unit.cancelShipWeaponFire();
                        }
                    }
                },
                {
                    offset: self.duration + 100,
                    label: 'undizzy',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        if (unit && unit.isAlive()) {
                            unit.dizzy = false;//now it can attack
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: Move ' + this.unitID + ' to ' +
                v.str(this.to);
        }
    });

    sh.actions.Attack = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            if (!json.damageDelay) {
                json.damageDelay = 0;
            }
            this.setJson({
                type: 'Attack',
                properties: ['attackerID', 'receiverID', 'damage', 'duration',
                    'damageDelay'],
                json: json
            });
            if (this.damageDelay > this.duration) {
                throw 'Attack action\'s damage delay can\'t be more than the ' +
                    'duration';
            }
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var attacker = battle.getUnitByID(self.attackerID);
                        attacker.onCooldown = true;
                    }
                },
                {
                    offset: self.damageDelay,
                    label: 'hit',
                    changer: function(battle) {
                        var attacker = battle.getUnitByID(self.attackerID),
                            receiver = battle.getUnitByID(self.receiverID);
                        if (attacker && attacker.isAlive() &&
                                receiver && receiver.isAlive()) {
                            receiver.hp -= self.damage;
                            //cancel weapon charging
                            receiver.cancelShipWeaponFire();
                            receiver.distracted = true;
                        }
                    }
                },
                {
                    offset: self.duration,
                    label: 'cooldown complete',
                    changer: function(battle) {
                        var attacker = battle.getUnitByID(self.attackerID);
                        if (attacker) {
                            attacker.onCooldown = false;
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: Attack ' + this.attackerID + ' -> ' +
                this.receiverID;
        }
    });

    sh.actions.DamageShip = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'DamageShip',
                properties: ['shipID', 'unitID', 'tile', 'damage', 'cooldown'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            ship = battle.getShipByID(self.shipID);
                        unit.onCooldown = true;
                        ship.hp -= self.damage;
                    }
                },
                {
                    offset: self.cooldown,
                    label: 'cooldown complete',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        if (unit) {
                            unit.onCooldown = false;
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: DamageShip, damage: ' + this.damage;
        }
    });

    sh.actions.DeclareWinner = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'DeclareWinner',
                properties: ['playerID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        battle.winner = self.playerID;
                    }
                }
            ]);
        }
    });

    sh.actions.SetUnitProperty = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'SetUnitProperty',
                properties: ['unitID', 'property', 'value'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        unit[self.property] = self.value;
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: SetUnitProperty (' + this.unitID + '): ' +
                this.property + ' = ' + this.value;
        }
    });

    sh.actions.FinishOrder = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'FinishOrder',
                properties: ['unitID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        unit.orders.shift();
                        battle.addUnitOrders(unit.makeUnitOrders());
                    }
                }
            ]);
        }
    });

    sh.actions.BeginShipWeaponCharge = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'BeginShipWeaponCharge',
                properties: ['unitID', 'weaponID', 'chargeTime'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            ship = unit.ship,
                            weapon = ship.getItemByID(self.weaponID);
                        unit.chargingShipWeapon = {
                            weaponID: self.weaponID,
                            startingTime: self.time
                        };
                        weapon.chargedBy = unit;
                    }
                },
                {
                    offset: self.chargeTime,
                    label: 'end',
                    changer: function() {//(battle)
                        //empty function: this change is here
                        //to trigger a getActions call from the
                        //unit responsible for firing.
                        return null;//for jsLint
                    }
                }
            ]);
        }
    });

    sh.actions.FireShipWeapon = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'FireShipWeapon',
                properties: ['unitID', 'weaponID', 'targetID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID);
                        unit.cancelShipWeaponFire();
                    }
                },
                {
                    offset: 800,
                    label: 'hit',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            shooterShip = unit.ship,
                            damagedShip = battle.getShipByID(self.targetID);
                        damagedShip.hp -= shooterShip
                            .getItemByID(self.weaponID).damage;
                    }
                }
            ]);
        }
    });

    sh.actions.Teleport = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Teleport',
                properties: ['unitID', 'targetShipID', 'teleporterID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            sourceShipID = unit.ship.id,
                            targetShip = battle.getShipByID(self.targetShipID);
                        unit.orders = [];
                        battle.addUnitOrders(unit.makeUnitOrders());
                        unit.ship.removeUnit(unit);
                        targetShip.putUnit(unit);
                        unit.teleported = true;
                        unit.teleportSource = {
                            teleporterID: self.teleporterID,
                            shipID: sourceShipID
                        };
                    }
                }
            ]);
        }
    });

    sh.actions.Recall = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Recall',
                properties: ['unitID'],
                json: json
            });
        },
        updateModelChanges: function() {
            var self = this;
            this.setChanges([
                {
                    offset: 0,
                    label: 'start',
                    changer: function(battle) {
                        var unit = battle.getUnitByID(self.unitID),
                            sourceShip = battle
                                .getShipByID(unit.teleportSource.shipID),
                            teleporter = sourceShip
                                .getItemByID(unit.teleportSource.teleporterID);
                        unit.orders = [];
                        battle.addUnitOrders(unit.makeUnitOrders());
                        unit.ship.removeUnit(unit);
                        sourceShip.putUnit(unit, teleporter);
                        unit.teleported = true;
                        unit.teleportSource = null;
                    }
                }
            ]);
        }
    });
}());

},{"../general-stuff":37,"./jsonable":27,"underscore":41}],25:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/
var sh = module.exports,
    Jsonable = require('./jsonable').Jsonable,
    _ = require('underscore')._,
    actions = require('./actions').actions,
    Ship = require('./ship').Ship,
    Player = require('./player').Player,
    OrderCollection = require('./orders').OrderCollection,
    utils = require('../utils').utils;

/**
 * A battle.
 */
sh.Battle = Jsonable.extendShared({
    ships: [],
    arbiter: {//actor that declares a winner
        type: 'Arbiter',
        getActions: function(turnTime, battle) {
            'use strict';
            if (battle.winner !== undefined) {
                return [];//winner already declared
            }
            var shipsByStatus = _.groupBy(battle.ships, function(ship) {
                return ship.hp <= 0 ? 'destroyed' : 'alive';
            }),
                unitsByPlayer;

            if (shipsByStatus.destroyed) {
                if (shipsByStatus.alive) {
                    return [new actions.DeclareWinner({
                        playerID: shipsByStatus.alive[0].owner.id
                    })];
                }
                //all ships destroyed... (draw?)
            }

            //Lose when player has no units left.
            unitsByPlayer = _.chain(battle.getUnits())
                .filter(function(u) {return u.isAlive(); })
                .groupBy('ownerID').value();

            if (_.size(unitsByPlayer) === 1) {
                return [new actions.DeclareWinner({
                    playerID: parseInt(_.keys(unitsByPlayer)[0], 10)
                })];
            }

            return [];
        }
    },
    init: function(json) {
        'use strict';
        this.setJson({
            type: 'Battle',
            properties: ['id', 'turnDuration', 'winner'],
            json: json
        });
        this.ships = _.map(json.ships, function(shipJson) {
            var ship = new Ship({json: shipJson});
            ship.battle = this;
            return ship;
        }, this);
        this.players = _.map(json.players, function(playerJson) {
            return new Player(playerJson);
        });
        this.pendingActions = [];
        this.orderCollection = new OrderCollection();
    },
    toJson: function() {
        'use strict';
        var json = this.parent();
        json.ships = utils.mapToJson(this.ships);
        json.players = utils.mapToJson(this.players);
        return json;
    },
    addShip: function(ship) {
        'use strict';
        ship.battle = this;
        ship.id = this.ships.length + 1;
        this.ships.push(ship);
    },
    getShipByID: function(id) {
        'use strict';
        return _.findWhere(this.ships, {id: id});
    },
    getPlayers: function() {
        'use strict';
        return _.pluck(this.ships, 'owner');
    },
    /**
     *@return Array Objects that have the .getActions method.
     */
    getActors: function() {
        'use strict';
        var actors = this.getUnits();
        actors = actors.concat(_.filter(this.getItems(), function(item) {
            return item.getActions !== undefined;
        }));
        actors.push(this.arbiter);
        return actors;
    },
    getUnits: function() {
        'use strict';
        return _.flatten(_.pluck(this.ships, 'units'));
    },
    getItems: function() {
        'use strict';
        return _.flatten(_.pluck(this.ships, 'built'));
    },
    getUnitByID: function(id) {
        'use strict';
        id = parseInt(id, 10);
        return _.findWhere(this.getUnits(), {id: id});
    },
    assignUnitID: function(unit) {
        'use strict';
        var units = this.getUnits();
        if (units.length === 0) {
            unit.id = 1;
            return;
        }
        unit.id = _.max(units, function(e) {
            return e.id;
        }).id + 1;
    },
    /**
     * Gets the orders from all the units as an sh.OrderCollection
     * @return {sh.OrderCollection}
     */
    extractOrders: function() {
        'use strict';
        return this.orderCollection;
    },
    /**
     * Distribute the orders among the units.
     * @param {sh.OrderCollection} orderCollection
     */
    insertOrders: function(orderCollection) {
        'use strict';
        var self = this;
        _.each(orderCollection.allUnitOrders, function(unitOrders) {
            self.addUnitOrders(unitOrders);
        });
    },
    addUnitOrders: function(unitOrders) {
        'use strict';
        this.orderCollection.addUnitOrders(unitOrders);
        this.getUnitByID(unitOrders.unitID).orders = unitOrders.array;
    },
    endOfTurnReset: function() {
        'use strict';
        _.invoke(this.ships, 'endOfTurnReset', this.turnDuration);
        //remove orders from dead units
        _.each(this.orderCollection.allUnitOrders, function(unitOrders) {
            if (!this.getUnitByID(unitOrders.unitID)) {
                delete this.orderCollection.allUnitOrders[unitOrders.unitID];
            }
        }, this);
    },
    getPlayerShips: function(playerID) {
        'use strict';
        return _.filter(this.ships, function(ship) {
            return ship.owner.id === playerID;
        });
    },
    getEnemyShips: function(playerID) {
        'use strict';
        return _.filter(this.ships, function(ship) {
            return ship.owner.id !== playerID;
        });
    }
});

},{"../utils":40,"./actions":24,"./jsonable":27,"./orders":29,"./player":30,"./ship":33,"underscore":41}],26:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = module.exports,
    TileEntity = require('./tile-entity').TileEntity,
    _ = require('underscore')._,
    pr = require('../placement-rules').pr,
    gen = require('../general-stuff'),
    GRID_SUB = gen.GRID_SUB,
    tiles = gen.tiles;
/**
 * Represents a component from the ship (Engine, Weapon, etc).
 * @type {*}
 */
sh.Item = TileEntity.extendShared({
    size: [1, 1],
    walkable: false,
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Item',
            properties: [],
            json: json
        });
        if (json) {
            this.rotated(json.r);
            this.ship = json.ship;
        }
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        //default placement rule
        return this.placementRule
            .compliesAt(x, y, ship.map);
    },
    canBuildRotated: function() {//(x, y, ship)
        'use strict';
        //default placement rule
        return false;
    },
    _rotated: false,
    rotated: function(rotated) {
        'use strict';
        if (rotated === undefined) {
            return this._rotated;
        }
        this._rotated = rotated;
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

    onBuilt: function() {
        'use strict';
        //abstract method
        return null;//for jsLint
    },
    onShip: function(ship) {
        'use strict';
        if (ship === undefined) {
            return this.ship;
        }
        this.ship = ship;
        return this;
    },
    toJson: function() {
        'use strict';
        var json = this.parent();
        json.r = this.rotated();
        return json;
    },
    setSize: function(width, height) {
        'use strict';
        this.size = [width, height];
        this.onSizeChanged();
    },
    onSizeChanged: function() {
        'use strict';
        this.placementRule = pr.make.spaceRule(tiles.clear,
            this.size[0], this.size[1]);
    }
});

/**
 * Enumerates all the concrete item constructors.
 * @type {{}}
 */
sh.items = {};

/**
 * A Weapon.
 * @type {*}
 */
sh.items.Weapon = sh.Item.extendShared({
    chargeTime: 2500,
    damage: 100,
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Weapon',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.weapon.compliesAt(x, y, ship.map);
    }
});

/**
 * An Engine.
 * @type {*}
 */
sh.items.Engine = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Engine',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.Engine.compliesAt(x, y, ship.map);
    }
});

/**
 * Power!
 * @type {*}
 */
sh.items.Power = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Power',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    }
});

/**
 * The Console next to the Power, Weapon or Engine.
 * A unit must run these items from the console.
 * @type {*}
 */
sh.items.Console = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Console',
            properties: [],
            json: json
        });
        this.setSize(GRID_SUB, GRID_SUB);
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.console.compliesAt(x, y, ship.map);
    },
    /**
     * Get the item that is controlled by this console.
     * @return {sh.Item}
     */
    getControlled: function() {
        'use strict';
        var x, y, atTile;
        if (this.controlled) {
            return this.controlled;
        }
        //assign controlled (the item being controlled by this console)
        for (y = this.y + GRID_SUB; y >= this.y - GRID_SUB;
                y -= GRID_SUB) {
            for (x = this.x - GRID_SUB; x <= this.x + GRID_SUB;
                    x += GRID_SUB) {
                atTile = this.ship.itemsMap.at(x, y);
                if (atTile.type === 'Weapon' || atTile.type === 'Engine' ||
                        atTile.type === 'Power') {
                    this.controlled = atTile;
                    return this.controlled;
                }
            }
        }
    }
});

/**
 * Component.
 * @type {*}
 */
sh.items.Component = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Component',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
    }
});

/**
 * Door. Can be placed on top of a Wall or between two Walls.
 * @type {*}
 */
sh.items.Door = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Door',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, GRID_SUB);
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return pr.door.compliesAt(x, y, ship.map);
    },
    canBuildRotated: function(x, y, ship) {
        'use strict';
        return pr.doorRotated.compliesAt(x, y, ship.map);
    }
});

/**
 * An individual Wall tile.
 * @type {*}
 */
sh.items.Wall = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Wall',
            properties: [],
            json: json
        });
        this.setSize(GRID_SUB, GRID_SUB);
        this.connected = {
            top: false,
            left: true,
            bottom: false,
            right: true
        };
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return this.parent(x, y, ship) ||
            ship.at(x, y) instanceof sh.items.Wall;
    },
    onBuilt: function() {
        'use strict';

        var top = this.ship.at(this.x, this.y - GRID_SUB),
            left = this.ship.at(this.x - GRID_SUB, this.y),
            bot = this.ship.at(this.x, this.y + GRID_SUB),
            right = this.ship.at(this.x + GRID_SUB, this.y);
        this.updateConnections(top, left, bot, right);
    },
    updateConnections: function(top, left, bot, right) {
        'use strict';
        //modify self and surrounding Walls' connections
        var it = sh.items,
            x = this.x,
            y = this.y;
        //reset
        this.connected.top = false;
        this.connected.left = false;
        this.connected.bottom = false;
        this.connected.right = false;

        if (top instanceof it.Wall) {
            top.connected.bottom = true;
            this.connected.top = true;
        } else if (top instanceof it.Door && top.rotated() &&
                top.y === y - 2 * GRID_SUB) {
            this.connected.top = true;
        }
        if (left instanceof it.Wall) {
            left.connected.right = true;
            this.connected.left = true;
        } else if (left instanceof it.Door && !left.rotated() &&
                left.x === x - 2 * GRID_SUB) {
            this.connected.left = true;
        }
        if (bot instanceof it.Wall) {
            bot.connected.top = true;
            this.connected.bottom = true;
        } else if (bot instanceof it.Door && bot.rotated() &&
                bot.y === y + GRID_SUB) {
            this.connected.bottom = true;
        }
        if (right instanceof it.Wall) {
            right.connected.left = true;
            this.connected.right = true;
        } else if (right instanceof it.Door && !right.rotated() &&
                right.x === x + GRID_SUB) {
            this.connected.right = true;
        }
    },
    isHorizontal: function() {
        'use strict';
        return !this.connected.top && !this.connected.bottom;
        //(because it's the default state)
    },
    isVertical: function() {
        'use strict';
        return !this.connected.left && !this.connected.right &&
            (this.connected.top || this.connected.bottom);
    }
});

/**
 * Weak spot.
 * @type {*}
 */
sh.items.WeakSpot = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'WeakSpot',
            properties: [],
            json: json
        });
        this.setSize(2 * GRID_SUB, 2 * GRID_SUB);
        this.walkable = true;
    }
});

/**
 * Teleports units that are standing on it.
 * @type {*}
 */
sh.items.Teleporter = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.setJson({
            type: 'Teleporter',
            properties: [],
            json: json
        });
        this.setSize(GRID_SUB, GRID_SUB);
        this.walkable = true;
    },
    /**
     * This method will be called by the script creator every time something
     * changed. The item's properties should not be changed in this method;
     * the script creator does that through the modelChanges array found in
     * each action.
     * @param {int} turnTime The current time.
     * @param {sh.Battle} battle The battle, representing the entire model
     * @return {Array}
     */
    getActions: function(turnTime, battle) {
        'use strict';
        var self = this,
            actions = [],
            Teleport = require('./actions').actions.Teleport;
        this.tiles(function(x, y) {
            _.each(self.ship.unitsMap.at(x, y), function(unit) {
                actions.push(new Teleport({
                    unitID: unit.id,
                    targetShipID: _.find(battle.ships, function(ship) {
                        return ship.id !== self.ship.id;
                    }).id,
                    teleporterID: self.id
                }));
            });
        });
        return actions;
    }
});

},{"../general-stuff":37,"../placement-rules":39,"./actions":24,"./tile-entity":34,"underscore":41}],27:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    SharedClass = require('./shared-class').SharedClass,
    _ = require('underscore')._;

(function() {
    'use strict';
    sh.Jsonable = SharedClass.extendShared({
        _properties: [],
        /**
         * Sets the properties found in the json param to the object.
         * This properties are later used by toJson to return the json form
         * of the object.
         * @param {{type:string, properties:Array, json:Object}} settings
         */
        setJson: function (settings) {
            var type = settings.type,
                properties = settings.properties,
                json = settings.json;
            if (!json) {
                json = {};
            }
            this.type = type;
            this._properties = this._properties.concat(properties);
            _.each(properties, function (p) {
                if (json[p] === undefined) {
                    return;
                }
                //workaround for nodejs converting numbers in a
                //json string to string when the client sends it to
                // the server.
                //TODO: remove when socket.io is implemented (if it doesn't
                // have this problem)
                if (json._numbers && _.isString(json[p]) &&
                        _.contains(json._numbers, p)) {
                    this[p] = parseFloat(json[p]);
                } else {
                    this[p] = json[p];
                }


            }, this);
        },
        toJson: function () {
            var json = {
                _numbers: [],
                type: this.type
            };
            _.each(this._properties, function (p) {
                json[p] = this[p];
                if (_.isNumber(this[p])) {
                    json._numbers.push(p);
                }
            }, this);
            return json;
        }
    });
}());

},{"./shared-class":32,"underscore":41}],28:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    SharedClass = require('./shared-class').SharedClass,
    utils = require('../utils').utils;

/**
 * An Array2d.
 * @type {*}
 */
sh.Map = SharedClass.extendShared({
    init: function(raw) {
        'use strict';
        //check consistent width
        var i, width;
        if (!raw) {
            throw 'raw parameter mandatory.';
        }
        width = raw[0].length;
        for (i = raw.length - 2; i >= 0; i--) {
            if (raw[i].length !== width) {
                throw 'the raw map has not consistent width';
            }
        }
        this.width = width;
        this.height = raw.length;
        this.raw = raw;
    },
    clear: function() {
        'use strict';
        var raw = this.raw;
        this.tiles(function(x, y) {
            raw[y][x] = 0;
        });
    },
    set: function(x, y, value) {
        'use strict';
        if (this.isInBounds(x, y)) {
            this.raw[y][x] = value;
        } else {
            throw 'Cannot set map at ' + x + ',' + y + ': out of bounds.';
        }
    },
    at: function(x, y) {
        'use strict';
        return this.raw[y] !== undefined ? this.raw[y][x] : undefined;
    },
    isInBounds: function(x, y) {
        'use strict';
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    },
    tiles: function(callback) {
        'use strict';
        var y, x;
        for (y = this.height - 1; y >= 0; y--) {
            for (x = this.width - 1; x >= 0; x--) {
                callback(x, y);
            }
        }
    },
    /**
     * Makes the map twice as large, three times at large, etc, according to
     * the multiplier.
     * @param {int} multiplier
     */
    scale: function(multiplier) {
        'use strict';
        var newMap = [],
            i,
            j;
        if (multiplier === 1) {
            return this;
        }
        _.each(this.raw, function(row, y) {
            y *= multiplier;
            for (i = 0; i < multiplier; i++) {
                newMap.push([]);//add <multiplier> rows for each row
            }
            _.each(row, function(tile, x) {
                x *= multiplier;
                for (i = 0; i < multiplier; i++) {
                    for (j = 0; j < multiplier; j++) {
                        newMap[y + i][x + j] = tile;
                    }
                }
            });
        });
        this.raw = newMap;
        this.width = newMap[0].length;
        this.height = newMap.length;
        return this;
    }
});

/**
 * A map of sh.TileEntity (which have x and y position)
 * @type {*}
 */
sh.EntityMap = sh.Map.extendShared({
    init: function(width, height, entityArray) {
        'use strict';
        this.parent(utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        'use strict';
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                self.set(x, y, e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * Each tile holds an array of entities.
 * @type {*}
 */
sh.EntityMap3d = sh.Map.extendShared({
    init: function(width, height, entityArray) {
        'use strict';
        this.parent(utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        'use strict';
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                if (!self.at(x, y)) {
                    self.set(x, y, []);
                }
                self.at(x, y).push(e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * A group of maps. The at function returns the last map that
 * has something in position (parameter) that is other than 0.
 * @type {*}
 */
sh.CompoundMap = sh.Map.extendShared({
    init: function(maps) {
        'use strict';
        if (!maps) {
            throw 'maps parameter mandatory.';
        }
        //check sizes
        (function() {
            var width = maps[0].width,
                height = maps[0].height,
                i;
            for (i = 1; i < maps.length; i++) {
                if (maps[i].width !== width ||
                        maps[i].height !== height) {
                    throw 'Maps for Compound should be the same size.';
                }
            }
        }());
        this.width = maps[0].width;
        this.height = maps[0].height;
        this.maps = maps;
    },
    at: function(x, y) {
        'use strict';
        var i, what;
        for (i = this.maps.length - 1; i >= 0; i--) {
            what = this.maps[i].at(x, y);
            if (what) {
                return what;
            }
        }
        return null;
    }
});


},{"../utils":40,"./shared-class":32,"underscore":41}],29:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/
var sh = module.exports,
    _ = require('underscore')._,
    PF = require('pathfinding'),
    SharedClass = require('./shared-class').SharedClass,
    Jsonable = require('./jsonable').Jsonable,
    utils = require('../utils').utils,
    v = require('../general-stuff').v,
    actions = require('./actions').actions,
    items = require('./items').items;

(function() {
    'use strict';
    var pathfinder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });

    sh.OrderCollection = SharedClass.extendShared({
        init: function(json) {
            this.allUnitOrders = {};
            if (json) {
                _.each(json, function(unitOrdersJson, unitID) {
                    this.allUnitOrders[unitID] =
                        new sh.UnitOrders(unitOrdersJson);
                }, this);
            }
        },
        /**
         * Adds a unit's orders to the collection.
         * @param {sh.UnitOrders} unitOrders
         */
        addUnitOrders: function(unitOrders) {
            this.allUnitOrders[unitOrders.unitID] = unitOrders;
        },
        getUnitOrders: function(unitID) {
            return this.allUnitOrders[unitID];
        },
        /**
         *
         * @param {sh.OrderCollection} orderCollection Another collection.
         */
        merge: function(orderCollection) {
            _.each(orderCollection.allUnitOrders, function(orders) {
                if (this.getUnitOrders(orders.unitID)) {
                    throw 'The collection already had orders for unit ' +
                        orders.unitID;
                }
                this.addUnitOrders(orders);
            }, this);
        },
        clone: function() {
            return new sh.OrderCollection(this.toJson());
        },
        toJson: function() {
            var json = {};
            _.each(this.allUnitOrders, function(unitOrders, unitID) {
                json[unitID] = unitOrders.toJson();
            });
            return json;
        }
    });

    sh.UnitOrders = SharedClass.extendShared({
        type: 'UnitOrders',
        init: function(json) {
            this.unitID = parseInt(json.unitID, 10);
            this.array = utils.mapFromJson(json.array, sh.orders);
            this.validate(this.unitID);
        },
        validate: function(unitID) {
            if (_.any(this.array, function(order) {
                    return order.unitID !== unitID;
                })) {
                throw 'There are orders that don\'t belong to the unit';
            }
        },
        add: function(order) {
            if (order.unitID !== this.unitID) {
                throw 'The order does not belong to the unit';
            }
            this.array.push(order);
        },
        toJson: function() {
            return {
                type: this.type,
                unitID: this.unitID,
                array: utils.mapToJson(this.array)
            };
        }
    });

    sh.Order = Jsonable.extendShared({
        init: function(json) {
            this.setJson({
                type: 'Order',
                properties: ['unitID'],
                json: json
            });
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID);
            return unit && unit.ownerID === playerID;
        }
    });

    function tileIsClear(time, ship, unit, tile) {
        var units = ship.unitsMap.at(tile.x, tile.y),
            arrivalTime = time + unit.getTimeForMoving(unit, tile, ship);
        return (!units ||//there's no unit ahead
            _.all(units, function(u) {
                return !u.isAlive() ||//or they're either dead...
                    (u.moving && //...or they're going away
                    !v.equal(u.moving.dest, tile) &&
                    u.moving.arrivalTime <= arrivalTime
                    );
            })) &&

            !_.any(ship.units,
                function(u) {
                    //no unit is moving there
                    return u.id !== unit.id &&
                        u.moving &&
                        v.equal(u.moving.dest, tile);
                });
    }

    sh.orders = {};

    //Abstract class
    sh.orders.GoTo = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
        },
        goTo: function(pos, battle) {
            var self = this,
                unit = battle.getUnitByID(this.unitID),
                ship = unit.ship;
            this.goToState = {
                to: pos,
                arrived: false,
                path: self.getPath(unit, pos, ship),
                pathIndex: 1
            };
        },
        getPath: function(from, to, ship) {
            if (!this.gridForPath) {
                this.gridForPath = new PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
            }
            return pathfinder.findPath(from.x, from.y, to.x, to.y,
                this.gridForPath.clone());
        },
        getMoveAction: function(time, battle) {
            var state = this.goToState,
                unit,
                ship,
                nextTile,
                from;
            if (state && !state.arrived) {
                unit = battle.getUnitByID(this.unitID);
                ship = unit.ship;
                if (v.equal(unit, state.to)) {
                    //unit is already at destination
                    state.arrived = true;
                    return null;
                }
                if (unit.moving) {
                    return null;
                }
                if (!state.path || state.pathIndex >= state.path.length) {
                    this.goToState.arrived = true;
                    return null;
                }
                nextTile = {x: state.path[state.pathIndex][0],
                    y: state.path[state.pathIndex][1]};
                if (tileIsClear(time, ship, unit, nextTile)) {
                    from = {x: unit.x, y: unit.y};
                    state.pathIndex++;
                    return new actions.Move({
                        unitID: unit.id,
                        from: from,
                        to: nextTile,
                        duration: unit.getTimeForMoving(from, nextTile, ship)
                    });
                }
                return null;
            }
            return null;
        }
    });
    sh.orders.Move = sh.orders.GoTo.extendShared({
        init: function(json) {
            this.parent(json);
            //in case its a me.Vector2D
            json.destination = {
                x: parseInt(json.destination.x, 10),
                y: parseInt(json.destination.y, 10)
            };
            this.setJson({
                type: 'Move',
                properties: ['destination'],
                json: json
            });
        },
        /**
         * Returns the actions for the unit to do while the order is the
         * active one.
         * @param {int} time
         * @param {sh.Battle} battle
         * @return {Array}
         */
        getActions: function(time, battle) {
            var move;
            if (!this.goToState) {
                this.goTo(this.destination, battle);
            }
            if (!this.goToState.arrived) {
                move = this.getMoveAction(time, battle);
                return move ? [move] : [];
            }
            return [new actions.FinishOrder({
                unitID: this.unitID
            })];
        },
        toString: function() {
            return 'Move to ' + v.str(this.destination);
        },
        isValid: function(battle, playerID) {
            var ship = battle.getUnitByID(this.unitID).ship;
            return this.parent(battle, playerID) &&
                ship.isWalkable(this.destination.x, this.destination.y);
        }
    });

    sh.orders.MoveToConsole = sh.orders.Move.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'MoveToConsole',
                properties: [],
                json: json
            });
        },
        toString: function() {
            return 'Move to Console';
        },
        isValid: function(battle, playerID) {
            var ship = battle.getUnitByID(this.unitID).ship;
            return this.parent(battle, playerID) &&
                ship.itemsMap.at(this.destination.x,
                    this.destination.y) instanceof items.Console;
        }
    });

    sh.orders.SeekAndDestroy = sh.orders.GoTo.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'SeekAndDestroy',
                properties: ['targetID'],
                json: json
            });
        },
        getActions: function(time, battle) {
            var unit, target, move;
            unit = battle.getUnitByID(this.unitID);
            target = battle.getUnitByID(this.targetID);
            if (!target || !target.isAlive() || unit.ship !== target.ship) {
                //unit is already dead
                return [new actions.SetUnitProperty({
                    unitID: unit.id,
                    property: 'targetID',
                    value: null
                }),
                    new actions.FinishOrder({
                        unitID: unit.id
                    })];
            }
            if (unit.targetID === null || unit.targetID === undefined) {
                return [new actions.SetUnitProperty({
                    unitID: unit.id,
                    property: 'targetID',
                    value: target.id
                })];
            }
            if (unit.moving) {
                return [];
            }
            if (unit.isInRange(target)) {
                return [];
            }
            if (!this.goToState ||
                    this.pathOutOfTarget(this.goToState.path, target)) {
                this.goTo(target, battle);
            }
            move = this.getMoveAction(time, battle);
            return move ? [move] : [];
        },
        pathOutOfTarget: function(path, target) {
            var pathLast = _.last(path);
            pathLast = {x: pathLast[0], y: pathLast[1]};
            return !v.equal(pathLast, target);
        },
        toString: function() {
            return 'Seek & Destroy';
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID),
                target = battle.getUnitByID(this.targetID);
            return this.parent(battle, playerID) &&
                target &&
                target.isAlive() &&
                unit.isEnemy(target) &&
                unit.ship === target.ship;
        }
    });

    sh.orders.Recall = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Recall',
                properties: [],
                json: json
            });
        },
        getActions: function() {//(turnTime, battle)
            return [new actions.Recall({
                unitID: this.unitID
            }),
                new actions.FinishOrder({
                    unitID: this.unitID
                })];
        },
        toString: function() {
            return 'Recall';
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID);
            return this.parent(battle, playerID) &&
                unit.teleportSource;
        }
    });
}());

},{"../general-stuff":37,"../utils":40,"./actions":24,"./items":26,"./jsonable":27,"./shared-class":32,"pathfinding":8,"underscore":41}],30:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, xyz*/

var sh = module.exports,
    Jsonable = require('./jsonable').Jsonable;

(function() {
    'use strict';
    sh.Player = Jsonable.extendShared({
        init: function(json) {
            this.setJson({
                type: 'Player',
                properties: ['id', 'name', 'state'],
                json: json
            });
        }
    });
}());

},{"./jsonable":27}],31:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = module.exports,
    _ = require('underscore')._,
    SharedClass = require('./shared-class').SharedClass,
    utils = require('../utils').utils,
    actions = require('./actions').actions;

(function() {
    'use strict';
    /**
     * A collection of Actions.
     * @type {*}
     */
    sh.Script = SharedClass.extendShared({
        turnDuration: 0,
        actions: [],
        sortedModelChangesIndex: [],
        init: function(parameters) {
            if (parameters) {
                this.actions = parameters.actions;
                this.turnDuration = parameters.turnDuration;
                this.sort();
            }
            this.sortedModelChangesIndex = [];
        },
        fromJson: function(json) {
            //logic here
            this.turnDuration = json.turnDuration;
            this.actions = utils.mapFromJson(json.actions, actions);
            _.invoke(this.actions, 'updateModelChanges');
            this.sortedModelChangesIndex = json.sortedModelChangesIndex;
            this.pendingActionsJson = json.pendingActionsJson;
            return this;
        },
        toJson: function() {
            return {
                type: 'Script',
                turnDuration: this.turnDuration,
                actions: utils.mapToJson(this.actions),
                sortedModelChangesIndex: this.sortedModelChangesIndex,
                pendingActionsJson: this.pendingActionsJson
            };
        },
        isWithinTurn: function(action) {
            return action.time < this.turnDuration && action.time >= 0;
        },
        sort: function() {
            this.actions = _.sortBy(this.actions, 'time');
        },
        /**
         * Inserts an action maintaining their order
         * @param {Action} action The action to be inserted.
         * @return {int} the index of the action.
         */
        insertAction: function(action) {
            var insertionIndex = _.sortedIndex(this.actions, action, 'time');
            //after actions of the same time
            while (this.actions[insertionIndex] &&
                    this.actions[insertionIndex].time === action.time) {
                insertionIndex++;
            }
            this.actions.splice(insertionIndex, 0, action);
            return insertionIndex;
        },
        /**
         * Filter the actions by type (String).
         * @param {String} type
         */
        byType: function(type) {
            return _.filter(this.actions, function(a) {
                return a.type === type;
            });
        },
        registerChange: function(modelChange) {
            if (modelChange.actionIndex === undefined) {
                return;
            }
            this.sortedModelChangesIndex.push({
                actionIndex: modelChange.actionIndex,
                index: modelChange.index
            });
        },
        /**
         * Returns the model changes in the order in which they
         * were registered by registerChange.
         * @return {Array}
         */
        getSortedModelChanges: function() {
            return _.map(this.sortedModelChangesIndex, function(i) {
                return this.actions[i.actionIndex].modelChanges[i.index];
            }, this);
        }
    });
}());

},{"../utils":40,"./actions":24,"./shared-class":32,"underscore":41}],32:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, xyz*/

var sh = module.exports;

(function() {
    'use strict';
    var initializing = false, //for SharedClass
        fnTest = /xyz/.test(function() {xyz;}) ? /\bparent\b/ : /.*/;
    /**
     * JavaScript Inheritance Helper
     * (the same as in melonJS)
     * */
    sh.SharedClass = function() {};
    sh.SharedClass.extendShared = function(prop) {
        // _super rename to parent to ease code reading
        var parent = this.prototype,
            proto,
            name;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        proto = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (name in prop) {
            // Check if we're overwriting an existing function
            proto[name] = typeof prop[name] === 'function' &&
                typeof parent[name] === 'function' &&
                fnTest.test(prop[name]) ? (function(name, fn) {
                    return function() {
                        var tmp = this.parent,
                            ret;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this.parent = parent[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        ret = fn.apply(this, arguments);
                        this.parent = tmp;

                        return ret;
                    };
                }(name, prop[name])) : prop[name];
        }

        // The dummy class constructor
        function Class() {
            if (!initializing && this.init) {
                this.init.apply(this, arguments);
            }
            //return this;
        }
        // Populate our constructed prototype object
        Class.prototype = proto;
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        // And make this class extendable
        Class.extendShared = sh.SharedClass.extendShared;//arguments.callee;
        Class.extend = function() {
            throw new Error('"extendShared" should be called instead of' +
                ' "extend" on a shared entity.');
        };
        return Class;
    };

    sh.TestSharedEntity = sh.SharedClass.extendShared({});
}());

},{}],33:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, hullMaps*/

var sh = module.exports,
    _ = require('underscore')._,
    SharedClass = require('./shared-class').SharedClass,
    maps = require('./map'),
    gen = require('../general-stuff'),
    GRID_SUB = gen.GRID_SUB,
    tiles = gen.tiles,
    items = require('./items').items,
    utils = require('../utils').utils,
    Player = require('./player').Player,
    Unit = require('./units').Unit,
    units = require('./units').units,
    Item = require('./items').Item,
    orders = require('./orders').orders;

/**
 * A ship.
 * @type {*}
 */
sh.Ship = SharedClass.extendShared({
    id: null,
    owner: null,
    hullMap: {},
    itemsMap: {},
    hp: 2000,
    init: function(settings) {
        'use strict';
        if (!settings.tmxName && !settings.json) {
            throw 'Ship settings must have tmxName or jsonData';
        }
        if (settings.json) {
            this.tmxName = settings.json.tmxName;
        } else {
            this.tmxName = settings.tmxName;
        }
        this.loadMap();
        //Array of items built
        this.built = [];
        this.itemsMap = new maps.EntityMap(this.width, this.height,
            this.built);
        this.units = [];
        this.unitsMap = new maps.EntityMap3d(this.width, this.height,
            this.units);
        this.map = new maps.CompoundMap([
            new maps.Map(this.hullMap).scale(GRID_SUB), this.itemsMap,
            this.unitsMap
        ]);
        if (settings.json) {
            this.fromJson(settings.json);
        }
    },
    loadMap: function() {
        'use strict';
        var hull;
        if (!hullMaps) {
            throw 'hullMaps global object not found';
        }
        hull = hullMaps[this.tmxName.toLowerCase()];
        if (!hull) {
            throw 'hullMap "' + this.tmxName.toLowerCase() + '" not found';
        }
        this.hullMap = hull.map;
        this.width = hull.width * GRID_SUB;
        this.height = hull.height * GRID_SUB;
    },
    //this should be called when the user builds something
    buildAt: function(x, y, buildingType) {
        'use strict';
        var self, building, canBuild, canBuildRotated;
        self = this;
        if (!items[buildingType]) {
            throw 'No such item type "' + buildingType + '".';
        }
        building = new items[buildingType]({});
        canBuild = building.canBuildAt(x, y, this);
        if (!canBuild) {
            canBuildRotated = building.canBuildRotated(x, y, this);
            if (canBuildRotated) {
                building.rotated(true);
            }
        }
        if (canBuild || canBuildRotated) {
            building.x = x;
            building.y = y;
            //remove anything in its way
            building.tiles(function(iX, iY) {
                self.removeAt(iX, iY);
            }, this);
            this.addItem(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    },
    //finds a clear spot and creates a new unit there
    putUnit: function(unit, position) {
        'use strict';
        //find empty spot
        var empty = null, ship = this;
        if (!position) {
            position = {//center of the ship
                x: Math.floor(ship.width / 2),
                y: Math.floor(ship.height / 2)
            };
        }
        empty = this.closestTile(position.x, position.y,
            function(tile) {
                return tile === tiles.clear;
            });
        utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
                if (empty) {
                    return;
                }
                if (ship.at(x, y) === tiles.clear) {
                    empty = {x: x, y: y};
                }
            });
        if (!empty) {
            throw new Error('Could not find empty position in ship');
        }
        unit.x = empty.x;
        unit.y = empty.y;
        if (unit.ownerID === undefined) {
            unit.ownerID = this.owner.id;
        }
        this.addUnit(unit);
        return unit;
    },
    /**
     * Finds the closest position to x, y that satisfies the condition
     * for the tile at that position.
     * It searches the map in a spiral fashion from the starting tile.
     * @param {int} x
     * @param {int} y
     * @param {Function} condition
     * @return {{x: int, y: int}}
     */
    closestTile: function(x, y, condition) {
        'use strict';
        var squareWidth = 1,
            going = 'right',
            direction,
            i,
            widthTimes2,
            heightTimes2;
        if (condition(this.map.at(x, y))) {
            return {x: x, y: y};
        }
        widthTimes2 = this.width * 2;
        heightTimes2 = this.height * 2;
        do {
            //change direction
            switch (going) {
            case 'down':
                going = 'left';
                direction = [-1, 0];
                break;
            case 'left':
                going = 'up';
                direction = [0, -1];
                break;
            case 'up':
                going = 'right';
                direction = [1, 0];
                break;
            case 'right':
                going = 'down';
                direction = [0, 1];
                //move to next outer square
                squareWidth += 2;
                x++;
                y--;
                break;
            }
            //traverse one side
            for (i = 0; i < squareWidth - 1; i++) {
                x += direction[0];
                y += direction[1];
                if (condition(this.map.at(x, y))) {
                    return {x: x, y: y};
                }
            }
        } while (squareWidth < widthTimes2 && squareWidth < heightTimes2);
        //didn't find any
        return null;
    },
    //Adds an item to the ship ignoring its placement rules
    addItem: function(item) {
        'use strict';
        if (item.id === undefined || item.id === null) {
            this.assignItemID(item);
        }
        this.built.push(item);
        item.onShip(this);
        this.buildingsChanged();
    },
    assignItemID: function(item) {
        'use strict';
        if (this.built.length === 0) {
            item.id = 1;
            return;
        }
        item.id = _.max(this.built, function(e) {
            return e.id;
        }).id + 1;
    },
    addUnit: function(unit) {
        'use strict';
        if (unit.id === undefined || unit.id === null) {
            this.battle.assignUnitID(unit);
        }
        this.units.push(unit);
        unit.ship = this;
        this.unitsMap.update();
    },
    getUnitByID: function(id) {
        'use strict';
        return _.find(this.units, function(u) {
            return u.id === parseInt(id, 10);
        });
    },
    getItemByID: function(id) {
        'use strict';
        return _.find(this.built, function(b) {
            return b.id === parseInt(id, 10);
        });
    },
    getPlayerUnits: function(playerID) {
        'use strict';
        return _.filter(this.units, function(unit) {
            return unit.ownerID === playerID;
        });
    },
    removeAt: function(x, y) {
        'use strict';
        //remove while is not string (is an item or unit)
        while (!(_.isString(this.at(x, y)))) {
            this.remove(this.at(x, y), true);
        }
    },
    remove: function(item, updateBuildings) {
        'use strict';
        var index;
        if (!item) {
            return;
        }
        if (updateBuildings === undefined) {
            updateBuildings = true; //updates by default
        }
        index = _.indexOf(this.built, item);
        this.built.splice(index, 1);
        if (updateBuildings) {
            this.buildingsChanged();
        }
    },
    removeAll: function() {
        'use strict';
        var self = this,
            i;
        for (i = this.built.length - 1; i >= 0; i--) {
            self.remove(this.built[i], false);
        }
        this.buildingsChanged();
    },
    removeUnit: function(unit) {
        'use strict';
        var index = _.indexOf(this.units, unit);
        this.units.splice(index, 1);
        this.unitsMap.update();
    },
    //to call whenever buildings change
    buildingsChanged: function() {
        'use strict';
        this.itemsMap.update();
        this.onBuildingsChanged();
    },
    onBuildingsChanged: function() {
        'use strict';
        return 0;
    },
    at: function(x, y) {
        'use strict';
        return this.map.at(x, y);
    },
    hasUnits: function(position) {
        'use strict';
        return this.unitsMap.at(position.x, position.y);
    },
    isInside: function(x, y) {
        'use strict';
        var tile = this.at(x, y);
        return tile !== tiles.solid && tile !== tiles.front &&
            tile !== tiles.back;
    },
    toJson: function() {
        'use strict';
        return {
            'tmxName': this.tmxName,
            'id': this.id,
            'hp': this.hp,
            'owner': this.owner ? this.owner.toJson() : null,
            'buildings': utils.mapToJson(this.built),
            'units': utils.mapToJson(this.units),
            'GRID_SUB': GRID_SUB
        };
    },
    fromJson: function(json) {
        'use strict';
        var ship = this,
            jsonGridSub;
        if (json.id !== undefined) {
            this.id = parseInt(json.id, 10);
        }
        if (json.hp !== undefined) {
            this.hp = parseInt(json.hp, 10);
        }
        this.owner = new Player(json.owner);
        if (json.GRID_SUB !== undefined) {
            jsonGridSub = parseInt(json.GRID_SUB, 10);
        } else {
            jsonGridSub = 1;
        }
        ship.removeAll();
        if (GRID_SUB !== jsonGridSub) {
            console.warn('GRID_SUB from json differs from current GRID_SUB,' +
                ' the values will be converted.');
        }
        _.each(json.buildings, function(b) {
            if (GRID_SUB !== jsonGridSub) {
                utils.convertPosition(b, jsonGridSub, GRID_SUB);
            }
            ship.addItem(new items[b.type](b));
        });
        _.each(json.units, function(u) {
            if (u.type === 'Unit') {//is generic unit
                ship.addUnit(new Unit(u));
            } else { //is specific unit
                ship.addUnit(new units[u.type](u));
            }
        });
        this.buildingsChanged();
    },
    getPfMatrix: function() {
        'use strict';
        var ship = this,
            pfMatrix = utils.getEmptyMatrix(this.width, this.height, 1);
        ship.map.tiles(function(x, y) {
            if (ship.isWalkable(x, y)) {
                pfMatrix[y][x] = 0;
            }
        });
        return pfMatrix;
    },
    isWalkable: function(x, y) {
        'use strict';
        var tile = this.map.at(x, y);
        //clear tiles and units are walkable
        return tile === tiles.clear || this.hasUnits({x: x, y: y}) ||
            (tile instanceof Item && tile.walkable);
    },
    endOfTurnReset: function(turnDuration) {
        'use strict';
        var self = this,
            i,
            unit;
        for (i = 0; i < this.units.length; i++) {
            unit = this.units[i];
            if (!unit.isAlive()) {
                self.removeUnit(unit);
                i--;
            } else {
                if (unit.chargingShipWeapon) {
                    unit.chargingShipWeapon.startingTime -= turnDuration;
                }
                unit.distracted = false;
                unit.teleported = false;
            }
        }
        this.unitsMap.update();
    },
    getValidOrderForPos: function(unit, pos) {
        'use strict';
        var stuff = this.map.at(pos.x, pos.y),
            enemies,
            order;
        if (_.isArray(stuff)) {
            enemies = _.filter(stuff, function(u) {
                return u instanceof Unit && u.isEnemy(unit);
            });
            if (enemies.length > 0) {
                order = new orders.SeekAndDestroy({
                    unitID: unit.id,
                    targetID: enemies[0].id
                });
            }
        } else {
            if (stuff instanceof items.Console) {
                order = new orders.MoveToConsole({
                    unitID: unit.id,
                    destination: {x: pos.x, y: pos.y}
                });
            } else if (this.isWalkable(pos.x, pos.y)) {
                order = new orders.Move({
                    unitID: unit.id,
                    destination: {x: pos.x, y: pos.y}
                });
            }
        }
        if (order && order.isValid(this, unit.ownerID)) {
            return order;
        }
        return null;
    }
});


},{"../general-stuff":37,"../utils":40,"./items":26,"./map":28,"./orders":29,"./player":30,"./shared-class":32,"./units":35,"underscore":41}],34:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = module.exports,
    Jsonable = require('./jsonable').Jsonable;
/**
 * An object on the ship. (An item, an unit, etc)
 * @type {*}
 */
sh.TileEntity = Jsonable.extendShared({
    id: null, //the ship is in charge of setting the id
    init: function(json) {
        'use strict';
        this.setJson({
            type: 'TileEntity',
            properties: ['id', 'x', 'y'],
            json: json
        });
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        //(only items can rotate, not units)
        return this.size[index];
    },
    //callback must have x and y. withinSize is optional
    tiles: function(callback, withinSize) {
        'use strict';
        var x, y,
            width = this.trueSize(0),
            height = this.trueSize(1);
        for (x = this.x; x < width + this.x &&
                (!withinSize || x < withinSize.width) && x >= 0; x++) {
            for (y = this.y; y < height + this.y &&
                    (!withinSize || y < withinSize.height) && y >= 0; y++) {
                callback(x, y);
            }
        }
    },
    getTiles: function() {
        'use strict';
        var tiles = [], x, y,
            width = this.trueSize(0),
            height = this.trueSize(1);
        for (x = this.x; x < width + this.x && x >= 0; x++) {
            for (y = this.y; y < height + this.y && y >= 0; y++) {
                tiles.push({x: x, y: y});
            }
        }
        return tiles;
    },
    //returns true is some part of the entity is occupying the tile
    occupies: function(tile) {
        'use strict';
        var x = tile.x, y = tile.y;
        return x >= this.x && x < this.x + this.trueSize(0) &&
            y >= this.y && y < this.y + this.trueSize(1);
    }
});

},{"./jsonable":27}],35:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    TileEntity = require('./tile-entity').TileEntity,
    UnitOrders = require('./orders').UnitOrders,
    items = require('./items').items,
    act = require('./actions').actions,
    v = require('../general-stuff').v;

/**
 * A crew member.
 * @type {*}
 */
sh.Unit = TileEntity.extendShared({
    imgIndex: 0,
    speed: 1, //tiles per second
    maxHP: 100,
    meleeDamage: 20,
    attackCooldown: 500,//time (ms) between each attack
    attackRange: 1,
    imageFacesRight: true,
    blocking: true,//if it slows enemy units passing by
    init: function(json) {
        'use strict';
        this.parent(json);
        this.size = [1, 1];
        this.setJson({
            type: 'Unit',
            properties: ['imgIndex', 'speed', 'maxHP', 'meleeDamage',
                'attackCooldown', 'attackRange', 'imageFacesRight', 'ownerID',
                'chargingShipWeapon', 'teleportSource'],
            json: json
        });
        this.hp = this.maxHP;
        this.inCombat = false;
        this.orders = [];
    },
    makeUnitOrders: function() {
        'use strict';
        var unitOrders = new UnitOrders({
            unitID: this.id
        });
        unitOrders.array = this.orders;
        return unitOrders;
    },
    isAlive: function() {
        'use strict';
        return this.hp > 0;
    },
    getTimeForOneTile: function() {
        'use strict';
        return 1000 / this.speed;
    },
    getTimeForMoving: function(from, to, ship) {
        'use strict';
        var self = this,
            oneTileTime = this.getTimeForOneTile(),
            tileDistance,
            isDiagonal,
            time;
        tileDistance = (function() {
            var a = to.x - from.x,
                b = to.y - from.y;
            if (a === 0) {
                if (b < 0) {
                    return -b;
                }
                return b;
            }
            if (a < 0) {
                return -a;
            }
            return a;
        }());
        isDiagonal = to.x - from.x !== 0 && to.y - from.y !== 0;
        if (isDiagonal) {
            time = tileDistance * oneTileTime * 1.41421356;
        } else {
            time = tileDistance * oneTileTime;
        }
        if (_.any(ship.at(from.x, from.y), function(u) {
                //an enemy blocks
                return u.isAlive() && u.ownerID !== self.ownerID && u.blocking;
            })) {
            //takes 4 times longer
            time *= 4;
        }
        return time;
    },
    getAttackActions: function() {//(turnTime, battle)
        'use strict';
        var actions = [],
            self = this,
            enemiesInRange,
            enemyToAttack;
        if (!this.onCooldown && !this.moving && !this.dizzy) {//attack ready
            enemiesInRange = _.filter(this.ship.units,
                function(u) {
                    return u.isAlive() &&
                        self.isEnemy(u) &&
                        self.isInRange(u);
                });
            if (this.targetID !== null && this.targetID !== undefined) {
                //if targetID is set, it has attack priority
                enemyToAttack = _.where(enemiesInRange,
                    {id: this.targetID})[0] ||
                    enemiesInRange[0];
            } else {
                enemyToAttack = enemiesInRange[0];
            }
            if (enemyToAttack) {
                actions.push(new act.Attack({
                    attackerID: self.id,
                    receiverID: enemyToAttack.id,
                    damage: self.meleeDamage,
                    duration: self.attackCooldown
                }));
            }
        }
        return actions;
    },
    inTeleporter: function() {
        'use strict';
        return this.ship.itemsMap.at(this.x, this.y) instanceof
            items.Teleporter;
    },
    getOrdersActions: function(turnTime, battle) {
        'use strict';
        var actions;
        if (this.orders.length > 0 && !this.inTeleporter()) {
            actions = this.orders[0].getActions(turnTime, battle);
            //if it's not gonna make it,
            //force arrival to the tile at end of turn
            if (turnTime < battle.turnDuration) {
                _.chain(actions)
                    .where({type: 'Move'})
                    .each(function(a) {
                        if (a.duration + turnTime > battle.turnDuration) {
                            a.duration = battle.turnDuration - turnTime;
                        }
                    });
            }
            return actions;
        }
        return [];
    },
    getDamageShipActions: function() {//(turnTime, battle)
        'use strict';
        if (this.ownerID !== this.ship.owner.id &&
                !this.moving &&
                !this.onCooldown && //attack ready
                !this.dizzy &&
                !this.inCombat &&
                this.ship.itemsMap.at(this.x, this.y) instanceof
                    items.WeakSpot) {
            return [new act.DamageShip({
                shipID: this.ship.id,
                unitID: this.id,
                tile: {x: this.x, y: this.y},
                damage: this.meleeDamage,
                cooldown: this.attackCooldown
            })];
        }
        return [];
    },
    /**
     * If it's in a console controlling some ship structure.
     */
    getShipControlActions: function() {//(turnTime, battle)
        'use strict';
        if (this.ownerID !== this.ship.owner.id) {
            return [];
        }
        var standingOn = this.ship.itemsMap.at(this.x, this.y),
            controlled;
        if (standingOn instanceof items.Console) {
            controlled = standingOn.getControlled();
        }
        if (controlled instanceof items.Weapon && !controlled.chargedBy) {
            return [new act.BeginShipWeaponCharge({
                unitID: this.id,
                weaponID: controlled.id,
                chargeTime: controlled.chargeTime
            })];
        }
        return [];
    },
    /**
     * This method will be called by the script creator every time something
     * changed. The unit's properties should not be changed in this method;
     * the script creator does that through the modelChanges array found in
     * each action.
     * @param {int} turnTime The current time.
     * @param {sh.Battle} battle The battle, representing the entire model
     * @return {Array}
     */
    getActions: function(turnTime, battle) {
        'use strict';
        var actions = [],
            shipWeapon;
        if (!this.isAlive()) {
            return [];
        }
        //turn start reset
        if (turnTime === 0 && !this.moving) {
            this.blocking = true;
        }
        if (!this.chargingShipWeapon) {
            actions = actions.concat(this.getAttackActions(turnTime, battle));
            if (actions.length === 0) {//damage ship only if it didn't attack
                actions = actions.concat(this.getDamageShipActions(turnTime,
                    battle));
            }
            if (!this.distracted) {
                actions = actions.concat(
                    this.getShipControlActions(turnTime, battle)
                );
            }
        } else {
            shipWeapon = this.ship.getItemByID(
                this.chargingShipWeapon.weaponID
            );
            if (turnTime >= this.chargingShipWeapon.startingTime +
                    shipWeapon.chargeTime) {
                actions.push(new act.FireShipWeapon({
                    unitID: this.id,
                    weaponID: this.chargingShipWeapon.weaponID,
                    targetID: battle.getEnemyShips(this.ownerID)[0].id
                }));
            }
        }
        actions = actions.concat(this.getOrdersActions(turnTime, battle));

        return actions;
    },
    isEnemy: function(unit) {
        'use strict';
        return unit.ownerID !== this.ownerID;
    },
    isInRange: function(unit) {
        'use strict';
        return v.distance(unit, this) <= this.attackRange;
    },
    cancelShipWeaponFire: function() {
        'use strict';
        var weapon;
        if (this.chargingShipWeapon) {
            weapon = this.ship.getItemByID(this.chargingShipWeapon.weaponID);
            weapon.chargedBy = null;
            this.chargingShipWeapon = null;
        }
    }

});

/**
 * All the different types of units.
 */
sh.units = (function() {
    'use strict';
    var u = {};
    u.Zealot = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 0;
            this.speed = 2;
            this.maxHP = 100;
            this.attackCooldown = 800;
            this.meleeDamage = 20;
            this.attackRange = 3;
            this.parent(json);
            this.setJson({
                type: 'Zealot',
                properties: [],
                json: json
            });
        },
        getAttackActions: function(turnTime, battle) {
            return _.map(this.parent(turnTime, battle), function(action) {
                action.damageDelay = 300;
                return action;
            });
        }
    });
    u.Critter = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 5;
            this.speed = 1;
            this.maxHP = 50;
            this.attackCooldown = 420;
            this.meleeDamage = 8;
            this.imageFacesRight = false;
            this.parent(json);
            this.setJson({
                type: 'Critter',
                properties: [],
                json: json
            });
        }
    });
    u.MetalSpider = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 28;
            this.speed = 3;
            this.maxHP = 160;
            this.attackCooldown = 1500;
            this.meleeDamage = 25;
            this.imageFacesRight = false;
            this.parent(json);
            this.setJson({
                type: 'MetalSpider',
                properties: [],
                json: json
            });
        }
    });
    return u;
}());

},{"../general-stuff":37,"./actions":24,"./items":26,"./orders":29,"./tile-entity":34,"underscore":41}],36:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = module.exports,
    _ = require('underscore')._,
    Script = require('./classes/script').Script,
    utils = require('./utils').utils,
    ModelChange = require('./classes/actions').ModelChange;

(function() {
    'use strict';
    var maxLoopsAtSameTime = 500;//to prevent endless loops.
    function insertByTime(array, item) {
        var insertionIndex = _.sortedIndex(array, item, 'time');
        array.splice(insertionIndex, 0, item);
    }

    function getVoidModelChange(time) {
        return new ModelChange(0, function() {
            return null;//for jslint
        }, {time: time});
    }

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param {sh.OrderCollection} orderCollection
     * @param {sh.Battle} battle
     * @param {Boolean} resetBattle Should the battle be cleaned up at the end.
     * @return {sh.Script}
     */
    function createScript(orderCollection, battle, resetBattle) {
        var script, queue, changes, time, actors, actor, i,
            registerActionReturned = {}, turnDuration = battle.turnDuration,
            changesAtSameTime = [];
        script = new Script({turnDuration: turnDuration});
        queue = [];
        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        function registerAction(returned, time) {
            return function(action) {
                action.time = time;
                action.updateModelChanges();
                script.actions.push(action);
                _.each(action.modelChanges, function(mc, index) {
                    if (mc.time >= 0) {
                    //Add actionIndex and index used by script.registerChange
                        mc.actionIndex = script.actions.length - 1;
                        mc.index = index;
                        if (mc.time === action.time) {
                            //apply immediate changes
                            mc.apply(battle);
                            script.registerChange(mc);
                            returned.immediateChanges.push(action.toString());
                        } else {
                            insertInQueue(mc);
                        }
                    }
                });
            };
        }

        //set the orders to the units
        battle.insertOrders(orderCollection);

        //null change to kick-start the process
        queue.push(getVoidModelChange(0));

        _.each(battle.pendingActions, function(action) {
            registerAction({}, action.time - turnDuration)(action);
        });

        //simulation loop (the battle gets modified and actions get added
        // to the script over time)
        while (queue.length > 0 && queue[0].time <= turnDuration) {
            time = queue[0].time;
            changes = _.where(queue, {time: time});
            _.invoke(changes, 'apply', battle);
            _.each(changes, script.registerChange, script);
            queue = queue.slice(changes.length);

            if (time < turnDuration) {
                //actions can't start at end of turn
                registerActionReturned.immediateChanges = [];
                actors = battle.getActors();
                for (i = 0; i < actors.length; i++) {
                    actor = actors[i];
                    _.each(actor.getActions(time, battle),
                        registerAction(registerActionReturned, time));
                }
                if (registerActionReturned.immediateChanges.length > 0) {
                    //If any actor returned any action with immediate model
                    //changes, the loop enters again at the same time.
                    changesAtSameTime.push(
                        registerActionReturned.immediateChanges
                    );
                    if (changesAtSameTime.length >= maxLoopsAtSameTime) {
                        throw 'Too much model changes at the same time (' +
                            time + 'ms). Changes stack: ' + changesAtSameTime
                            .slice(changesAtSameTime.length - 11,
                                changesAtSameTime.length - 1).toString() +
                            ' ...';
                    }
                    insertInQueue(getVoidModelChange(time));
                } else {
                    changesAtSameTime = [];
                }
            }
        }

        battle.pendingActions = _.chain(queue)
            .pluck('action')
            .uniq()
            .value();
        script.pendingActionsJson = utils.mapToJson(battle.pendingActions);

        //clean up
        if (resetBattle) {
            battle.endOfTurnReset();
        }
        return script;
    }

    //export
    sh.createScript = createScript;
}());

},{"./classes/actions":24,"./classes/script":31,"./utils":40,"underscore":41}],37:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = module.exports;

(function() {
    'use strict';
    /**
     * The grid gets subdivided in its width and its height according to this
     * constant.
     * @type {number}
     */
    sh.GRID_SUB = 2;


    /**
     * Vector math.
     * @type {{sub: Function, add: Function, mul: Function, div: Function, equal: Function}}
     */
    sh.v = {
        sub: function(v1, v2) {
            return { x: v1.x - v2.x, y: v1.y - v2.y };
        },
        add: function(v1, v2) {
            return { x: v1.x + v2.x, y: v1.y + v2.y };
        },
        mul: function(v, scalar) {
            return { x: v.x * scalar, y: v.y * scalar};
        },
        div: function(v, scalar) {
            return { x: v.x / scalar, y: v.y / scalar};
        },
        equal: function(v1, v2) {
            if (!v1 || !v2) {
                return false;
            }
            return v1.x === v2.x && v1.y === v2.y;
        },
        map: function(v, fun) {
            return {x: fun(v.x), y: fun(v.y)};
        },
        str: function(v) {
            return '(' + v.x + ', ' + v.y + ')';
        },
        distance: function(v1, v2) {
            return Math.sqrt(Math.pow(v2.x - v1.x, 2) +
                Math.pow(v2.y - v1.y, 2));
        }
    };

    sh.tiles = {
        solid: 's',
        front: 'f',
        back: 'b',
        clear: '.'
    };

    sh.mapNames = [
        'test',
        'cyborg_battleship1',
        'cyborg_cruiser',
        'cyborg_drone',
        'cyborg_frigate',
        'humanoid_battleship',
        'humanoid_cruiser',
        'humanoid_drone',
        'humanoid_frigate',
        'liquid_battleship',
        'liquid_cruiser',
        'liquid_drone',
        'liquid_frigate',
        'mechanoid_battleship',
        'mechanoid_cruiser',
        'mechanoid_drone',
        'mechanoid_frigate'
    ];

    //Object holding references to functions that will be tested.
    sh.forTesting = {};

    //used in testing
    sh.getProperties = function(object) {
        var props = [], p;
        for (p in object) {
            if (object.hasOwnProperty(p)) {
                props.push(p);
            }
        }
        return props;
    };
}());


},{}],38:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var _ = require('underscore')._,
    sh = {};

sh.PF = require('pathfinding');
module.exports = _.extend(sh,
    require('./general-stuff'),
    require('./utils'),
    require('./placement-rules'),
    require('./classes/shared-class'),
    require('./classes/jsonable'),
    require('./classes/player'),
    require('./classes/tile-entity'),
    require('./classes/items'),
    require('./classes/units'),
    require('./classes/map'),
    require('./classes/ship'),
    require('./classes/battle'),
    require('./classes/actions'),
    require('./classes/orders'),
    require('./classes/script'),
    require('./create-script')
    );
},{"./classes/actions":24,"./classes/battle":25,"./classes/items":26,"./classes/jsonable":27,"./classes/map":28,"./classes/orders":29,"./classes/player":30,"./classes/script":31,"./classes/shared-class":32,"./classes/ship":33,"./classes/tile-entity":34,"./classes/units":35,"./create-script":36,"./general-stuff":37,"./placement-rules":39,"./utils":40,"pathfinding":8,"underscore":41}],39:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    Map = require('./classes/map').Map,
    gen = require('./general-stuff'),
    tiles = gen.tiles,
    GRID_SUB = gen.GRID_SUB;

/**
 * Library for facilitating configuring the rules for placement for the items.
 * @type {{PlacementRule: Function, make: {spaceRule: Function, nextToRule: Function}, utils: {checkAny: Function, checkAll: Function, checkAnyOrAll: Function}}}
 */
sh.pr = {
    /**
     * A placement rule
     * @param {{tile:{Object}, inAny:{Array}, inAll:{Array}}} settings
     * @constructor
     */
    PlacementRule: function(settings) { //settings: tile, inAny, inAll
        'use strict';
        var wantedTile;
        //sugar for tileSatisfies = function(tile){return tile == <tile>;}
        this.tile = settings.tile;
        this.inAny = settings.inAny;// Array of {x,y} (relative coordinates)
        this.inAll = settings.inAll;// Array of {x,y} (relative coordinates)
        this.tileCondition = settings.tileCondition; // function(tile)
        if (this.tileCondition === undefined && this.tile !== undefined) {
            wantedTile = this.tile;
            this.tileCondition = function(tile) {
                return tile === wantedTile;
            };
        }
        this.compliesAt = function(x, y, map) {
            if (!(map instanceof Map)) {
                throw 'map should be an instance of sh.Map';
            }
            return sh.pr.utils.checkAny(map, this.tileCondition, this.inAny, {
                x: x,
                y: y
            }) && sh.pr.utils.checkAll(map, this.tileCondition, this.inAll, {
                x: x,
                y: y
            });
        };
    },
    make: {
        //has to have enough space
        spaceRule: function(tileCondition, width, height) {
            'use strict';
            var coordArray = [], x, y, settings;
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    coordArray.push({
                        x: x,
                        y: y
                    });
                }
            }
            settings = {
                inAll: coordArray
            };
            if (_.isFunction(tileCondition)) {
                settings.tileCondition = tileCondition;
            } else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new sh.pr.PlacementRule(settings);
        },
        //has to be next to something
        nextToRule: function(tileCondition, width, height) {
            'use strict';
            var coordArray = [], x, y, settings;
            for (x = 0; x < width; x++) {
                coordArray.push({
                    x: x,
                    y: -1
                }); //top
                coordArray.push({
                    x: x,
                    y: height
                }); //bottom
            }
            for (y = 0; y < height; y++) {
                coordArray.push({
                    x: -1,
                    y: y
                }); //left
                coordArray.push({
                    x: width,
                    y: y
                }); //right
            }
            settings = {
                inAny: coordArray
            };
            if (_.isFunction(tileCondition)) {
                settings.tileCondition = tileCondition;
            } else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new sh.pr.PlacementRule(settings);
        }
    },
    utils: {
        //check if a tile is at any of the positions in "relativeCoords"
        checkAny: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return sh.pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, true);
        },
        //check if a tile is at all of the positions in "relativeCoords"
        checkAll: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return sh.pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, false);
        },
        checkAnyOrAll: function(tileMap, tileCondition, relativeCoordinates,
                currentCoord, inAny) {
            'use strict';
            var coor, wantedTileCoord, tileAtCoord;
            if (!relativeCoordinates || relativeCoordinates.length === 0) {
                return true;
            }
            for (coor = 0; coor < relativeCoordinates.length; coor++) {
                wantedTileCoord = relativeCoordinates[coor];
                tileAtCoord = tileMap.at(currentCoord.x + wantedTileCoord.x,
                    currentCoord.y + wantedTileCoord.y);
                if (inAny && tileAtCoord &&
                        tileCondition(tileAtCoord)) {
                    return true;
                }
                if (!inAny && (!tileAtCoord ||
                    !tileCondition(tileAtCoord))) {
                    return false;
                }
            }
            return !inAny;
        }

    }
};

//add prebuilt placement rules for items
(function() {
    'use strict';
    function s(value) {
        return value * GRID_SUB;
    }
    var pr = sh.pr,
        space1x1 = pr.make.spaceRule(tiles.clear, s(1), s(1)),
        space2x1 = pr.make.spaceRule(tiles.clear, s(2), s(1)),
        space1x2 = pr.make.spaceRule(tiles.clear, s(1), s(2)),
        space2x2 = pr.make.spaceRule(tiles.clear, s(2), s(2));

    function and(ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map) {
                return ruleA.compliesAt(x, y, map) &&
                    ruleB.compliesAt(x, y, map);
            }
        };
    }
    function or(ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map) {
                return ruleA.compliesAt(x, y, map) ||
                    ruleB.compliesAt(x, y, map);
            }
        };
    }

    //SPECIAL PLACEMENT RULES FOR ITEMS

    pr.weapon = and(space2x2, new sh.pr.PlacementRule({
        tile: tiles.front,
        inAny: [{
            x: s(2),
            y: s(0)
        }, {
            x: s(2),
            y: s(1)
        }]
    }));

    pr.Engine = and(space2x2, new sh.pr.PlacementRule({
        tile: tiles.back,
        inAll: [{
            x: s(-1),
            y: s(0)
        }, {
            x: s(-1),
            y: s(1)
        }]
    }));

    pr.console = and(space1x1, sh.pr.make.nextToRule(function(tile) {
        return tile.type === 'Weapon' || tile.type === 'Engine' ||
            tile.type === 'Power';
    }, s(1), s(1)));

    pr.door = or(pr.make.spaceRule(function(tile) {
        return tile.type === 'Wall' && tile.isHorizontal();
    }, s(2), s(1)),
        //or...
        and(space2x1,
            //and...
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile.type === 'Wall';
            }, inAll: [{x: s(-1), y: s(0)}, {x: s(2), y: s(0)}]}))
        );

    pr.doorRotated = or(pr.make.spaceRule(function(tile) {
        return tile.type === 'Wall' && tile.isVertical();
    }, s(1), s(2)),
        and(space1x2,
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile.type === 'Wall';
            }, inAll: [{x: s(0), y: s(-1)}, {x: s(0), y: s(2)}]})));
}());

},{"./classes/map":28,"./general-stuff":37,"underscore":41}],40:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._;

/**
 * Utilities
 * @type {{getEmptyMatrix: Function, matrixTiles: Function}}
 * @return {null}
 */
sh.utils = {
    getEmptyMatrix: function(width, height, initialValue) {
        'use strict';
        var matrix = [], i, j;
        for (i = 0; i < height; i++) {
            matrix.push([]);
            for (j = 0; j < width; j++) {
                matrix[i].push(initialValue);
            }
        }
        return matrix;
    },
    //useful when wanting to do something at every coordinate of a matrix
    matrixTiles: function(width, height, callback) { // callback(x, y)
        'use strict';
        var x, y;
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                callback(x, y);
            }
        }
    },
    convertPosition: function(pos, fromGridSub, toGridSub) {
        'use strict';
        pos.x = pos.x * (toGridSub / fromGridSub);
        pos.y = pos.y * (toGridSub / fromGridSub);
    },
    mapToJson: function(arrayOfObjects) {
        'use strict';
        return _.map(arrayOfObjects, function(o) {
            return o.toJson();
        });
    },
    mapFromJson: function(arrayOfJsons, constructorCollection) {
        'use strict';
        return _.map(arrayOfJsons, function(json) {
            return new constructorCollection[json.type](json);
        });
    },
    removeFromArray: function(item, array) {
        'use strict';
        var index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
};


},{"underscore":41}],41:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],42:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, bootstrapped*/

// game resources
// in the case of the items, set their image name equal to their type.
function getShipAssets(shipType) {
    'use strict';
    var race = shipType.split('_')[0];
    return [{
        name: shipType,
        type: 'tmx',
        src: '/_common/outlines/' + shipType + '.tmx'
    }, {
        name: shipType + '_img',
        type: 'image',
        src: '/_common/img/render/ships/' + race +
            '/' + shipType + '_img.png'
    }];
}

var assets = [{
    name: 'outline',
    type: 'image',
    src: '/_common/img/render/outline.png'
}, {
    name: 'selector',
    type: 'image',
    src: '/_common/img/render/selector.png'
}, {
    name: 'pause-icon',
    type: 'image',
    src: '/_common/img/render/pause-icon.png'
}, {
    name: 'weapon',
    type: 'image',
    src: '/_common/img/render/weapon_01.png'
}, {
    name: 'engine',
    type: 'image',
    src: '/_common/img/render/engine_01.png'
}, {
    name: 'power',
    type: 'image',
    src: '/_common/img/render/power_01.png'
}, {
    name: 'console',
    type: 'image',
    src: '/_common/img/render/console_02.png'
}, {
    name: 'component',
    type: 'image',
    src: '/_common/img/render/components_01.png'
}, {
    name: 'door',
    type: 'image',
    src: '/_common/img/render/door_01.png'
}, {
    name: 'wall',
    type: 'image',
    src: '/_common/img/render/wall_001.png'
}, {
    name: 'weakspot',
    type: 'image',
    src: '/_common/img/render/weakspot.png'
}, {
    name: 'teleporter',
    type: 'image',
    src: '/_common/img/render/teleporter.png'
}, {
    name: 'metatiles32x32',
    type: 'image',
    src: '/_common/img/render/metatiles32x32.png'
}, {
    name: 'area_01',
    type: 'tmx',
    src: '/_common/outlines/small.tmx'
}, {
    name: 'test',
    type: 'tmx',
    src: '/_common/outlines/test.tmx'
}, {
    name: 'button',
    type: 'image',
    src: '/_common/img/render/button.png'
}, {
    name: 'creatures',
    type: 'image',
    src: '/_common/img/render/creatures.png'
}, {
    name: 'creatures_16x16',
    type: 'image',
    src: '/_common/img/render/creatures_16x16.png'
}, {
    name: 'star_hit_white',
    type: 'image',
    src: '/_common/img/render/star_hit_white.png'
}, {
    name: 'nothing',
    type: 'image',
    src: '/_common/img/render/nothing.png'
}, {
    name: 'projectile',
    type: 'image',
    src: '/_common/img/render/projectile.png'
}, {
    name: 'markers',
    type: 'image',
    src: '/_common/img/render/markers.png'
}, {
    name: 'charging-weapon-icon',
    type: 'image',
    src: '/_common/img/render/charging-weapon-icon.png'
}];

assets = assets.concat(getShipAssets(bootstrapped.shipJson.tmxName));
module.exports = assets;
},{}],43:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, me, shipType, hullMaps*/

//sugar
var jsApp, gs, sh, ShipBuilding, assets;
gs = require('client/game-state');
sh = require('shared');
gs.TILE_SIZE = 32 / sh.GRID_SUB;
gs.HALF_TILE = 16 / sh.GRID_SUB;
ShipBuilding = require('./ship-building-screen');
assets = require('./assets');

require('client/melonjs-plugins');

jsApp = {
    loadReady: false,
    /* ---

    Initialize the jsApp

    --- */
    onload: function() {
        'use strict';
        // init the video
        //to get ship width: hullMaps[shipType].width * gs.TILE_SIZE
        if (!me.video.init('jsapp', 1440, 1344)) {
            alert('Sorry but your browser does not support html 5 canvas.');
            return;
        }
        // initialize the "audio"
        //        me.audio.init("mp3,ogg");
        // set all resources to be loaded
        me.loader.onload = this.loaded.bind(this);
        // set all resources to be loaded
        me.loader.preload(assets);
        // load everything & display a loading screen
        me.state.change(me.state.LOADING);
    },
    /* ---
    callback when everything is loaded
    --- */
    loaded: function() {
        'use strict';
        var self = this;

        gs.player = new sh.Player({
            id: 777,
            name: 'hardcoded name'
        });
        me.state.set('ship-building', new ShipBuilding());
        me.state.change('ship-building');
        self.loadReady = true;
        self.onAppLoaded();

    },
    /*
    useful for testing
    */
    onAppLoaded: function() {
        'use strict';
        return 0;
    }
};

window.onReady(function() {
    'use strict';
    jsApp.onload();
});
},{"./assets":42,"./ship-building-screen":44,"client/game-state":2,"client/melonjs-plugins":4,"shared":38}],44:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/


/*global require, module, $, me, bootstrapped*/
var sh = require('shared'),
    ShipVM = require('./ship-vm'),
    utils = require('client/utils'),
    itemVMs = require('client/item-vms').itemVMs,
    ui = require('client/ui'),
    _ = require('underscore')._;

/* Screen where one builds the ship */
module.exports = me.ScreenObject.extend({
    ship: null,
    prevMouse: {},
    init: function() {
        'use strict';
        this.parent(true);
    },
    /**
     *
     * @param {Object} settings has tmxName or jsonData.
     */
    onResetEvent: function() {
        'use strict';
        var self = this;
        // stuff to reset on state change
        this.ship = new sh.Ship({json: bootstrapped.shipJson});
        this.shipVM = new ShipVM(this.ship);
        this.shipVM.showInScreen();
        this.ship.onBuildingsChanged = function() {
            self.updateGreenSpots();
        };

        me.game.sort();

        me.input.bindKey(me.input.KEY.ESC, 'escape');
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport,
            this.mouseMove.bind(this));
        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('dblclick', me.game.viewport,
            this.mouseDbClick.bind(this));

        this.mouseLockedOn = null;
        this.prepareGhostItems();
        this.greenSpots = sh.utils.getEmptyMatrix(this.ship.width,
            this.ship.height, 1);
        this.onHtmlLoaded();
    },

    /* ---
    action to perform when game is finished (state change)
    --- */
    onDestroyEvent: function() {
        'use strict';
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('dblclick', me.game.viewport);
    },
    update: function() {
        'use strict';
        this.shipVM.update();
        if (me.input.isKeyPressed('escape')) {
            if (this.mouseLockedOn) {
                this.mouseLockedOn.lockedEscape();
                return;
            }
            if (this.chosen) {
                this.choose();
            }
        }
        _.each(this.drawingScreen, function(item) {
            item.update();
        });
    },


    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        _.each(this.drawingScreen, function(item) {
            item.draw(ctx);
        });
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this;
        $('.item').click(function() {
            var idItem, itemName;
            if (me.state.isCurrent(me.state.LOADING)) {
                return;
            }
            idItem = $('img', this).attr('id');
            itemName = idItem.substring(5, idItem.length);
            me.state.current().choose(itemName);
        });

        //Save
        $('#file_save').click(function() {
            var shipJson = screen.ship.toJson();
            $.post('/ship/save', {
                hullID: bootstrapped.hullID,
                name: $('#ship-name').val(),
                tier: $('#ship-tier').val(),
                jsonString: JSON.stringify(shipJson)
            },
                function(response) {
                    if (response) {
                        location.href = '/ship-list?edit=true';
                    } else {
                        alert('Error: Could not save ship.');
                    }
                }, 'json');
        });
        $('#jsapp').find('canvas').css({width: '', height: ''});
    },
    mouseDbClick: function() {
        'use strict';
        //note: the "this" context is a canvas, not the screen
        var mouseTile, screen = me.state.current();
        mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (screen.mouseLockedOn) { //the mouse is involved in a specific obj
            //delegate handling to the object
            screen.mouseLockedOn.lockedMouseDbClick(mouseTile);
            return;
        }

        me.game.sort();
        me.game.repaint();
    },

    mouseDown: function(e) {
        'use strict';
        var mouseTile, item, which;
        which = e.which - 1; //workaround for melonJS mismatch
        mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (this.mouseLockedOn) { //the mouse is involved in a specific obj
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseDown(mouseTile);
            return;
        }

        item = this.ship.at(mouseTile.x, mouseTile.y);
        if (item !== null && item instanceof sh.Item) {
            if (which === me.input.mouse.RIGHT) {
                this.deleteItem(item);
            } else {
                this.selected = item;
                if (!this.chosen) {
                    this.beginDrag(item);
                }
            }
        }
        me.game.sort();
        me.game.repaint();
    },
    mouseMove: function() {
        'use strict';
        var mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        if ((this.prevMouse.x === mouseTile.x &&
                this.prevMouse.y === mouseTile.y)) {
            return;
        }
        this.prevMouse.x = mouseTile.x;
        this.prevMouse.y = mouseTile.y;
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (this.mouseLockedOn) { //the mouse is involved in a specific obj
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseMove(mouseTile);
            if (this.mouseLockedOn.type === 'Wall' ||
                    this.mouseLockedOn.type === 'Door') {
                this.updateWalls();
            }
            return;
        }
        if (!this.chosen) {
            return;
        }
        this.moveGhost(mouseTile.x, mouseTile.y);

        if (this.chosen.type === 'Wall' ||
                this.chosen.type === 'Door') {
            this.updateWalls();
        }
        me.game.sort();
        me.game.repaint();
    },
    mouseUp: function(e) {
        'use strict';
        var mouseTile, which;
        which = e.which - 1; //workaround for melonJS mismatch
        mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (this.mouseLockedOn) { //the mouse is involved in a specific object
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseUp(mouseTile);
            me.game.sort();
            me.game.repaint();
            return;
        }

        if (this.chosen && !this.dragging) {
            if (which === me.input.mouse.LEFT) {
                this.buildItem(mouseTile.x, mouseTile.y, this.chosen.type);
                if (this.chosen.type === 'Door' ||
                        this.chosen.type === 'Wall') {
                    this.updateWalls();
                }
            }
        } else if (this.dragging) {
            this.endDrag(mouseTile);
        }

        me.game.sort();
        me.game.repaint();

    },
    updateWalls: function() {
        'use strict';
        var items = _.union(me.game.getEntityByName('item'),
            this.drawingScreen);
        _.invoke(_.where(items, {type: 'Wall'}), 'updateAnimation');
    },
    buildItem: function(x, y, type) {
        'use strict';
        var built = this.ship.buildAt(x, y, type);
        if (built) {
            this.shipVM.update();
            this.shipVM.getVM(built).onBuilt();
        }
    },
    deleteItem: function(item) {
        'use strict';
        this.ship.remove(item, true);
        this.updateRed();
    },
    makeItem: function(type, settings) {
        'use strict';
        var Constructor, model;
        model = new sh.items[type](settings);
        Constructor = itemVMs[type];
        return new Constructor(model);
    },
    /* User Interface Stuff*/
    chosen: null, //the chosen object from the panel (an Item)
    mouseLockedOn: null, //who the mouse actions pertain to.
    ghostItems: {}, //Items that exist for the sole purpose of...
    prepareGhostItems: function() {
        'use strict';
        var type, newItem;
        this.ghostItems = {};//Items to be used when choosing building location
        for (type in itemVMs) {
            if (itemVMs.hasOwnProperty(type)) {
                newItem = this.makeItem(type, {x: 0, y: 0});
                this.ghostItems[type] = newItem;
                newItem.hide();
                me.game.add(newItem, ui.layers.indicators);
                newItem.onShip(false);
            }
        }
    },

    // ...showing the position at which they will be built.
    choose: function(name) {
        'use strict';
        if (this.chosen) {
            if (this.chosen.type === name) {
                return;
            }
            this.chosen.hide();
            this.clearRed();
            $('#item_' + this.chosen.type).removeClass('chosen');

            me.game.repaint();
        }
        this.chosen = this.ghostItems[name];
        if (!this.chosen) {
            this.chosen = null;
            return;
        }
        var mouse = utils.getMouse();
        this.chosen
            .setX(mouse.x)
            .setY(mouse.y)
            .show().alpha = 0.8;
        this.updateGreenSpots();

        $('#item_' + this.chosen.type).addClass('chosen');
        me.game.sort();
        me.game.repaint();
    },
    moveGhost: function(x, y) {
        'use strict';
        this.chosen.setX(x).setY(y);
        //Rotate if it fits somewhere
        if (!this.chosen.rotated() &&
                this.chosen.m.canBuildRotated(x, y, this.ship)) {
            this.chosen.rotated(true);
        }
        if (this.chosen.rotated() &&
                this.chosen.m.canBuildAt(x, y, this.ship)) {
            this.chosen.rotated(false);
        }
        this.updateRed();
    },
    //Dragging
    dragging: null,
    beginDrag: function(building) {
        'use strict';
        if (this.chosen) {
            console.log('There should be nothing chosen when drag begins. ' +
                '(this.beginDrag)');
        }
        this.ship.remove(building, true);
        this.choose(building.type);
        this.dragging = building;
    },
    endDrag: function(mouse) {
        'use strict';
        if (!this.dragging) {
            return;
        }
        if (this.dragging.canBuildAt(mouse.x, mouse.y, this.ship)) {
            this.dragging.x = mouse.x;
            this.dragging.y = mouse.y;
        }
        this.ship.addItem(this.dragging);
        this.choose();
        this.dragging = null;
        this.shipVM.update();
    },
    //Red overlay
    redScreen: [],
    redIndex: 0,
    printRed: function(x, y) {
        'use strict';
        this.redScreen[this.redIndex] = new ui.RedColorEntity(x, y, {});
        me.game.add(this.redScreen[this.redIndex], ui.layers.colorOverlay);
        this.redIndex++;
    },
    clearRed: function() {
        'use strict';
        var i;
        for (i = this.redIndex; i > 0; i--) {
            me.game.remove(this.redScreen[i - 1]);
            this.redScreen.pop();
        }
        this.redIndex = 0;
    },
    updateRed: function() {
        'use strict';
        this.clearRed();
        var self = this;
        if (this.chosen) {
            this.chosen.tiles(function(iX, iY) {
                if (self.greenSpots[iY][iX] === 1) {
                    self.printRed(iX, iY);
                }
            }, self.ship);
        }
    },
    //A matrix of 1 and 0. In 1 should be red overlay when trying to build
    greenSpots: null,
    updateGreenSpots: function() {
        'use strict';
        var self = this,
            ship = this.ship;
        if (!this.chosen) {
            return;
        }
        self.greenSpots = sh.utils.getEmptyMatrix(ship.width, ship.height, 1);
        ship.map.tiles(function(x, y) {
            var i, j, cWidth, cHeight;
            if (self.chosen.m.canBuildAt(x, y, ship)) {
                cWidth = self.chosen.size[0];
                cHeight = self.chosen.size[1];
            }
            if (self.chosen.m.canBuildRotated(x, y, ship)) {
                cWidth = self.chosen.size[1];
                cHeight = self.chosen.size[0];
            }
            for (i = x; i < cWidth + x && i < ship.width; i++) {
                for (j = y; j < cHeight + y && j < ship.height; j++) {
                    self.greenSpots[j][i] = 0;
                }
            }
        });
    },
    drawingScreen: [],
    //draws arbitrary stuff
    drawItem: function(x, y, type) {
        'use strict';
        var item = this.makeItem(type, {x: x, y: y});
        item.alpha = 0.8;
        this.drawingScreen.push(item);
        me.game.repaint();
    },
    clear: function() {
        'use strict';
        this.drawingScreen = [];
        this.clearRed();
        me.game.repaint();
    },

    //combines the ship map with the drawing screen
    at: function(x, y) {
        'use strict';
        var i, shipTile;
        for (i = 0; i < this.drawingScreen.length; i++) {
            if (this.drawingScreen[i].occupies({x: x, y: y})) {
                return this.drawingScreen[i];
            }
        }
        shipTile = this.ship.map.at(x, y);
        if (shipTile === sh.tiles.clear && this.chosen &&
                this.chosen.occupies({x: x, y: y})) {
            return this.chosen;
        }
        return shipTile;
    }
});



},{"./ship-vm":45,"client/item-vms":3,"client/ui":6,"client/utils":7,"shared":38,"underscore":41}],45:[function(require,module,exports){
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me, _, ko*/

var utils = require('client/utils'),
    ItemVM = require('client/item-vms').ItemVM,
    itemVMs = require('client/item-vms').itemVMs,
    ui = require('client/ui');

/**
 * An object in charge of representing a sh.Ship on the screen.
 * @param {sh.Ship} shipModel the ship model.
 * @constructor
 */
var ShipVM = module.exports = function(shipModel) {
    'use strict';
    this.itemVMs = [];

    this.m = shipModel;
    this.showInScreen = function() {
        me.levelDirector.loadLevel(this.m.tmxName);
    };
    /**
     * Updates melonJS objects for items to be drawn on the screen
     * according to the ship model.
     * @return {bool}
     * @this {ShipVM}
     */
    this.update = function() {
        var somethingChanged = false;
        if (this.updateItems()) {
            somethingChanged = true;
        }
        if (somethingChanged) {
            me.game.sort();
        }
        return somethingChanged;
    };
    this.updateItems = function() {
        return utils.updateVMs({
            models: this.m.built,
            vms: this.itemVMs,
            zIndex: ui.layers.items,
            DefaultConstructor: ItemVM,
            vmConstructors: itemVMs
        });
    };
    this.draw = function(ctx) {
        return ctx;
    };

    this.getVM = function(item) {
        return utils.getVM(item, this.m.built, this.itemVMs);
    };
};

},{"client/item-vms":3,"client/ui":6,"client/utils":7}]},{},[43])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeS1taWRkbGV3YXJlXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvY2xpZW50L2RyYXcuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL2NsaWVudC9nYW1lLXN0YXRlLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9jbGllbnQvaXRlbS12bXMuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL2NsaWVudC9tZWxvbmpzLXBsdWdpbnMuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL2NsaWVudC90aWxlLWVudGl0eS12bS5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvY2xpZW50L3VpLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9jbGllbnQvdXRpbHMuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL2luZGV4LmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9wYXRoZmluZGluZy9zcmMvUGF0aEZpbmRpbmcuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL3NyYy9jb3JlL0dyaWQuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL3NyYy9jb3JlL0hlYXAuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL3NyYy9jb3JlL0hldXJpc3RpYy5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvcGF0aGZpbmRpbmcvc3JjL2NvcmUvTm9kZS5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvcGF0aGZpbmRpbmcvc3JjL2NvcmUvVXRpbC5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvcGF0aGZpbmRpbmcvc3JjL2ZpbmRlcnMvQVN0YXJGaW5kZXIuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL3NyYy9maW5kZXJzL0Jlc3RGaXJzdEZpbmRlci5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvcGF0aGZpbmRpbmcvc3JjL2ZpbmRlcnMvQmlBU3RhckZpbmRlci5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvcGF0aGZpbmRpbmcvc3JjL2ZpbmRlcnMvQmlCZXN0Rmlyc3RGaW5kZXIuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL3NyYy9maW5kZXJzL0JpQnJlYWR0aEZpcnN0RmluZGVyLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9wYXRoZmluZGluZy9zcmMvZmluZGVycy9CaURpamtzdHJhRmluZGVyLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9wYXRoZmluZGluZy9zcmMvZmluZGVycy9CcmVhZHRoRmlyc3RGaW5kZXIuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3BhdGhmaW5kaW5nL3NyYy9maW5kZXJzL0RpamtzdHJhRmluZGVyLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9wYXRoZmluZGluZy9zcmMvZmluZGVycy9KdW1wUG9pbnRGaW5kZXIuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9jbGFzc2VzL2FjdGlvbnMuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9jbGFzc2VzL2JhdHRsZS5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL2NsYXNzZXMvaXRlbXMuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9jbGFzc2VzL2pzb25hYmxlLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9zaGFyZWQvY2xhc3Nlcy9tYXAuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9jbGFzc2VzL29yZGVycy5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL2NsYXNzZXMvcGxheWVyLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9zaGFyZWQvY2xhc3Nlcy9zY3JpcHQuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9jbGFzc2VzL3NoYXJlZC1jbGFzcy5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL2NsYXNzZXMvc2hpcC5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL2NsYXNzZXMvdGlsZS1lbnRpdHkuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9jbGFzc2VzL3VuaXRzLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy9zaGFyZWQvY3JlYXRlLXNjcmlwdC5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL2dlbmVyYWwtc3R1ZmYuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvbm9kZV9tb2R1bGVzL3NoYXJlZC9pbmRleC5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL3BsYWNlbWVudC1ydWxlcy5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9ub2RlX21vZHVsZXMvc2hhcmVkL3V0aWxzLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvc2NyZWVucy9zaGlwLWJ1aWxkZXIvY2xpZW50LWpzL2Fzc2V0cy5qcyIsIkQ6L1Byb2plY3RzL1NwYWNlUnVubmVyIHN0dWZmL1NwYWNlUnVubmVyL3NyYy9zY3JlZW5zL3NoaXAtYnVpbGRlci9jbGllbnQtanMvZW50cnkuanMiLCJEOi9Qcm9qZWN0cy9TcGFjZVJ1bm5lciBzdHVmZi9TcGFjZVJ1bm5lci9zcmMvc2NyZWVucy9zaGlwLWJ1aWxkZXIvY2xpZW50LWpzL3NoaXAtYnVpbGRpbmctc2NyZWVuLmpzIiwiRDovUHJvamVjdHMvU3BhY2VSdW5uZXIgc3R1ZmYvU3BhY2VSdW5uZXIvc3JjL3NjcmVlbnMvc2hpcC1idWlsZGVyL2NsaWVudC1qcy9zaGlwLXZtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2NENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25iQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSovXHJcblxyXG52YXIgZ3MgPSByZXF1aXJlKCcuL2dhbWUtc3RhdGUnKSxcclxuICAgIFRJTEVfU0laRSA9IGdzLlRJTEVfU0laRSxcclxuICAgIEhBTEZfVElMRSA9IGdzLkhBTEZfVElMRTtcclxuXHJcbi8qKlxyXG4gKiBEcmF3cyBzdHVmZiBvbiB0aGUgY2FudmFzIGJhc2VkIG9uIGNhbnZhcycgcHJpbWl0aXZlc1xyXG4gKiBAdHlwZSB7e319XHJcbiAqL1xyXG52YXIgZHJhdyA9IG1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdmFyIGxpbmVEYXNoT2Zmc2V0ID0gMTAwMDtcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGxpbmVEYXNoT2Zmc2V0LS07XHJcbiAgICAgICAgaWYgKGxpbmVEYXNoT2Zmc2V0ID09PSAwKSB7XHJcbiAgICAgICAgICAgIGxpbmVEYXNoT2Zmc2V0ID0gMTAwMDtcclxuICAgICAgICB9XHJcbiAgICB9LCA2NCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRpbGVIaWdobGlnaHQ6IGZ1bmN0aW9uKGN0eCwgcG9zLCBjb2xvciwgdGhpY2tuZXNzKSB7XHJcbiAgICAgICAgICAgIHZhciBwaXhlbFBvcyA9IHt4OiBwb3MueCAqIFRJTEVfU0laRSxcclxuICAgICAgICAgICAgICAgIHk6IHBvcy55ICogVElMRV9TSVpFfTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7XHJcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlja25lc3M7XHJcbiAgICAgICAgICAgIGN0eC5tb3ZlVG8ocGl4ZWxQb3MueCwgcGl4ZWxQb3MueSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KHBpeGVsUG9zLngsIHBpeGVsUG9zLnksIFRJTEVfU0laRSwgVElMRV9TSVpFKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNpcmNsZTogZnVuY3Rpb24oY3R4LCBwb3NpdGlvbiwgc2l6ZSwgY29sb3IpIHtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gY29sb3I7XHJcbiAgICAgICAgICAgIGN0eC5hcmMoKHBvc2l0aW9uLnggKiBUSUxFX1NJWkUpICsgSEFMRl9USUxFLFxyXG4gICAgICAgICAgICAgICAgKHBvc2l0aW9uLnkgKiBUSUxFX1NJWkUpICsgSEFMRl9USUxFLFxyXG4gICAgICAgICAgICAgICAgc2l6ZSwgMCwgTWF0aC5QSSAqIDIsIGZhbHNlKTtcclxuICAgICAgICAgICAgY3R4LmZpbGwoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbmU6IGZ1bmN0aW9uKGN0eCwgZnJvbSwgdG8sIGNvbG9yLCB0aGlja25lc3MpIHtcclxuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSBjb2xvcjtcclxuICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaWNrbmVzcztcclxuICAgICAgICAgICAgY3R4Lm1vdmVUbyhmcm9tLngsIGZyb20ueSk7XHJcbiAgICAgICAgICAgIGN0eC5saW5lVG8odG8ueCwgdG8ueSk7XHJcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldExpbmVEYXNoT2Zmc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxpbmVEYXNoT2Zmc2V0O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0oKSk7XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgbW9kdWxlKi9cclxuXHJcbnZhciBncyA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgLy9zaC5QbGF5ZXJcclxuICAgIHBsYXllcjogbnVsbCxcclxuICAgIC8vc2guU2hpcFxyXG4gICAgc2hpcDogbnVsbCxcclxuICAgIC8vc2VsZWN0ZWQgVGlsZUVudGl0eVZNcyBhdCBhIGdpdmVuIG1vbWVudC5cclxuICAgIHNlbGVjdGVkOiBbXSxcclxuICAgIFRJTEVfU0laRTogMzIsXHJcbiAgICBIQUxGX1RJTEU6IDE2XHJcbn07XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgZXhwb3J0cywgbWUqL1xyXG5cclxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyksXHJcbiAgICBQRiA9IHJlcXVpcmUoJ3BhdGhmaW5kaW5nJyksXHJcbiAgICBzaCA9IHJlcXVpcmUoJ3NoYXJlZCcpLFxyXG4gICAgVGlsZUVudGl0eVZNID0gcmVxdWlyZSgnLi90aWxlLWVudGl0eS12bScpLFxyXG4gICAgZHJhdyA9IHJlcXVpcmUoJy4vZHJhdycpO1xyXG5cclxuLyoqXHJcbiAqIEEgbWVsb25KUyBvYmplY3QgdXNlZCB0byByZXByZXNlbnQgYW4gc2guSXRlbSBvbiBzY3JlZW4uXHJcbiAqIEB0eXBlIHsqfVxyXG4gKi9cclxudmFyIEl0ZW1WTSA9IFRpbGVFbnRpdHlWTS5leHRlbmQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24oeCwgeSwgc2V0dGluZ3MpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5vblNoaXBBbmltYXRpb25zID0ge1xyXG4gICAgICAgICAgICBub3JtYWw6IG51bGwsXHJcbiAgICAgICAgICAgIHJvdGF0ZWQ6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMub2ZmU2hpcEFuaW1hdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIG5vcm1hbDogbnVsbCxcclxuICAgICAgICAgICAgcm90YXRlZDogbnVsbFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHNldHRpbmdzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFzZXR0aW5ncy5uYW1lKSB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLm5hbWUgPSAnaXRlbSc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGFyZW50KHgsIHksIHNldHRpbmdzKTtcclxuICAgIH0sXHJcblxyXG4gICAgdXBkYXRlQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGFuaW07XHJcbiAgICAgICAgaWYgKHRoaXMuX29uU2hpcCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tLnJvdGF0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgYW5pbSA9IHRoaXMub25TaGlwQW5pbWF0aW9ucy5yb3RhdGVkO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYW5pbSA9IHRoaXMub25TaGlwQW5pbWF0aW9ucy5ub3JtYWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tLnJvdGF0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgYW5pbSA9IHRoaXMub2ZmU2hpcEFuaW1hdGlvbnMucm90YXRlZDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFuaW0gPSB0aGlzLm9mZlNoaXBBbmltYXRpb25zLm5vcm1hbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYW5pbSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRBbmltYXRpb24oYW5pbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNhbkJ1aWxkQXQ6IGZ1bmN0aW9uKHgsIHksIHNoaXApIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubS5jYW5CdWlsZEF0KHgsIHksIHNoaXApO1xyXG4gICAgfSxcclxuICAgIGNhbkJ1aWxkUm90YXRlZDogZnVuY3Rpb24oeCwgeSwgc2hpcCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gdGhpcy5tLmNhbkJ1aWxkUm90YXRlZCh4LCB5LCBzaGlwKTtcclxuICAgIH0sXHJcbiAgICByb3RhdGVkOiBmdW5jdGlvbihyb3RhdGVkKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBwcmV2ID0gdGhpcy5tLnJvdGF0ZWQoKTtcclxuICAgICAgICBpZiAocm90YXRlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm0ucm90YXRlZCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocm90YXRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmFuZ2xlID0gTWF0aC5QSSAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5hbmdsZSA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubS5yb3RhdGVkKHJvdGF0ZWQpO1xyXG4gICAgICAgIGlmIChwcmV2ICE9PSB0aGlzLm0ucm90YXRlZCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQW5pbWF0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIC8vdGFrZXMgcm90YXRpb24gaW50byBhY2NvdW50XHJcbiAgICB0cnVlU2l6ZTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubS50cnVlU2l6ZShpbmRleCk7XHJcbiAgICB9LFxyXG4gICAgLy9jYWxsYmFjayBtdXN0IGhhdmUgeCBhbmQgeS4gd2l0aGluU2l6ZSBpcyBvcHRpb25hbFxyXG4gICAgdGlsZXM6IGZ1bmN0aW9uKGNhbGxiYWNrLCB3aXRoaW5TaXplKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB4LCB5O1xyXG4gICAgICAgIGZvciAoeCA9IHRoaXMueDsgeCA8IHRoaXMudHJ1ZVNpemUoMCkgKyB0aGlzLnggJiZcclxuICAgICAgICAgICAgICAgICghd2l0aGluU2l6ZSB8fCB4IDwgd2l0aGluU2l6ZS53aWR0aCkgJiYgeCA+PSAwOyB4KyspIHtcclxuICAgICAgICAgICAgZm9yICh5ID0gdGhpcy55OyB5IDwgdGhpcy50cnVlU2l6ZSgxKSArIHRoaXMueSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICghd2l0aGluU2l6ZSB8fCB5IDwgd2l0aGluU2l6ZS5oZWlnaHQpICYmIHkgPj0gMDsgeSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh4LCB5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvL29uQnVpbHQgaXMgY2FsbGVkIG9ubHkgd2hlbiB0aGUgdXNlciBoaW1zZWxmIGJ1aWxkcyBpdFxyXG4gICAgb25CdWlsdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICghbWUuc3RhdGUuaXNDdXJyZW50KCdzaGlwLWJ1aWxkaW5nJykpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignaXRlbS5vbkJ1aWx0IGNhbGxlZCB3aGVuIG5vdCBidWlsZGluZyB0aGUgc2hpcCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2Fic3RyYWN0IG1ldGhvZFxyXG4gICAgfSxcclxuICAgIHRlbXA6IHt9LCAvL2ZvciBzdG9yaW5nIHRlbXBvcmFyeSBzdHVmZiAodGhlIHdhbGwgdXNlcyB0aGlzKVxyXG4gICAgX29uU2hpcDogZmFsc2UsXHJcbiAgICBvblNoaXA6IGZ1bmN0aW9uKG9uU2hpcCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgcHJldiA9IHRoaXMuX29uU2hpcDtcclxuICAgICAgICBpZiAob25TaGlwID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29uU2hpcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX29uU2hpcCA9IG9uU2hpcDtcclxuICAgICAgICBpZiAocHJldiAhPT0gdGhpcy5fb25TaGlwKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQW5pbWF0aW9uKCk7XHJcbiAgICAgICAgICAgIGlmIChvblNoaXApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2hlbk9uU2hpcCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aGVuT2ZmU2hpcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIHdoZW5PblNoaXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gJyc7Ly9mb3IganNMaW50XHJcbiAgICB9LFxyXG4gICAgd2hlbk9mZlNoaXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gJyc7Ly9mb3IganNMaW50XHJcbiAgICB9LFxyXG4gICAgdG9Kc29uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IHNlbGYudHlwZSxcclxuICAgICAgICAgICAgeDogc2VsZi54LFxyXG4gICAgICAgICAgICB5OiBzZWxmLnksXHJcbiAgICAgICAgICAgIHJvdGF0ZWQ6IHNlbGYucm90YXRlZCgpLFxyXG4gICAgICAgICAgICBzZXR0aW5nczoge31cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnZhciBpdGVtVk1zID0ge307XHJcblxyXG5cclxuLypcclxuICAgIEluIGVhY2ggaXRlbSwgc2V0IHNpemUgYW5kIHR5cGUgYmVmb3JlIGNhbGxpbmcgcGFyZW50KClcclxuKi9cclxuXHJcbi8qKlxyXG4gKiBXZWFwb24gdmlldyBtb2RlbC5cclxuICogQHR5cGUge3ZvaWR8KnxDbGFzc3xleHRlbmR8ZXh0ZW5kfGV4dGVuZH1cclxuICovXHJcbml0ZW1WTXMuV2VhcG9uID0gSXRlbVZNLmV4dGVuZCh7XHJcbiAgICAvLyBpbml0IGZ1bmN0aW9uXHJcbiAgICBpbml0OiBmdW5jdGlvbih3ZWFwb25Nb2RlbCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnR5cGUgPSAnV2VhcG9uJztcclxuICAgICAgICB0aGlzLnNpemUgPSB3ZWFwb25Nb2RlbC5zaXplO1xyXG4gICAgICAgIHRoaXMudG90YWxTaXplID0gWzMgKiBzaC5HUklEX1NVQiwgMiAqIHNoLkdSSURfU1VCXTtcclxuICAgICAgICB0aGlzLm0gPSB3ZWFwb25Nb2RlbDtcclxuICAgICAgICB0aGlzLnBhcmVudCh3ZWFwb25Nb2RlbC54LCB3ZWFwb25Nb2RlbC55LCB7fSk7XHJcbiAgICAgICAgdGhpcy5vblNoaXAod2VhcG9uTW9kZWwub25TaGlwKCkpO1xyXG4gICAgICAgIHRoaXMuZmlyZU9mZnNldCA9IHt4OiA2NCwgeTogMzJ9O1xyXG4gICAgfSxcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICh0aGlzLmZpcmluZykge1xyXG4gICAgICAgICAgICB0aGlzLnNob3RYICs9IDMyO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuc2hvdFggPiAyMDApIHtcclxuICAgICAgICAgICAgdGhpcy5maXJpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudCgpO1xyXG4gICAgfSxcclxuICAgIGRyYXc6IGZ1bmN0aW9uKGN0eCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChjdHgpO1xyXG4gICAgICAgIHZhciBmaXJlRnJvbSA9IHNoLnYuYWRkKHRoaXMucG9zLCB0aGlzLmZpcmVPZmZzZXQpLFxyXG4gICAgICAgICAgICBsYXNlckxlbmd0aCA9IHRoaXMuc2hvdFggLSBmaXJlRnJvbS54O1xyXG4gICAgICAgIGlmIChsYXNlckxlbmd0aCA+IDEwMCkge1xyXG4gICAgICAgICAgICBsYXNlckxlbmd0aCA9IDEwMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZmlyaW5nKSB7XHJcbiAgICAgICAgICAgIGN0eC5zYXZlKCk7XHJcbiAgICAgICAgICAgIGRyYXcubGluZShjdHgsIHt4OiB0aGlzLnNob3RYLCB5OiBmaXJlRnJvbS55fSxcclxuICAgICAgICAgICAgICAgIHt4OiB0aGlzLnNob3RYIC0gbGFzZXJMZW5ndGgsIHk6IGZpcmVGcm9tLnl9LCAnIzIzMjZEOScsIDIwKTtcclxuICAgICAgICAgICAgY3R4LnJlc3RvcmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcGxheUZpcmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLmZpcmluZyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5zaG90WCA9IHRoaXMucG9zLnggKyB0aGlzLmZpcmVPZmZzZXQueDtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogRW5naW5lIHZpZXcgbW9kZWwuXHJcbiAqIEB0eXBlIHt2b2lkfCp8Q2xhc3N8ZXh0ZW5kfGV4dGVuZHxleHRlbmR9XHJcbiAqL1xyXG5pdGVtVk1zLkVuZ2luZSA9IEl0ZW1WTS5leHRlbmQoe1xyXG4gICAgLy8gaW5pdCBmdW5jdGlvblxyXG4gICAgaW5pdDogZnVuY3Rpb24oRW5naW5lTW9kZWwpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy50eXBlID0gJ0VuZ2luZSc7XHJcbiAgICAgICAgdGhpcy5zaXplID0gRW5naW5lTW9kZWwuc2l6ZTtcclxuICAgICAgICB0aGlzLnRvdGFsU2l6ZSA9IFszICogc2guR1JJRF9TVUIsIDIgKiBzaC5HUklEX1NVQl07XHJcbiAgICAgICAgdGhpcy5jYW5ub25UaWxlID0gW3NoLkdSSURfU1VCLCAwXTtcclxuICAgICAgICB0aGlzLm0gPSBFbmdpbmVNb2RlbDtcclxuICAgICAgICB0aGlzLnBhcmVudChFbmdpbmVNb2RlbC54LCBFbmdpbmVNb2RlbC55LCB7fSk7XHJcbiAgICAgICAgdGhpcy5vblNoaXAoRW5naW5lTW9kZWwub25TaGlwKCkpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vKipcclxuICogUG93ZXIgdmlldyBtb2RlbC5cclxuICogQHR5cGUge3ZvaWR8KnxDbGFzc3xleHRlbmR8ZXh0ZW5kfGV4dGVuZH1cclxuICovXHJcbml0ZW1WTXMuUG93ZXIgPSBJdGVtVk0uZXh0ZW5kKHtcclxuICAgIC8vIGluaXQgZnVuY3Rpb25cclxuICAgIGluaXQ6IGZ1bmN0aW9uKHBvd2VyTW9kZWwpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy50eXBlID0gJ1Bvd2VyJztcclxuICAgICAgICB0aGlzLnNpemUgPSBwb3dlck1vZGVsLnNpemU7XHJcbiAgICAgICAgdGhpcy5tID0gcG93ZXJNb2RlbDtcclxuICAgICAgICB0aGlzLnBhcmVudChwb3dlck1vZGVsLngsIHBvd2VyTW9kZWwueSwge30pO1xyXG4gICAgICAgIHRoaXMub25TaGlwKHBvd2VyTW9kZWwub25TaGlwKCkpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBDb25zb2xlIHZpZXcgbW9kZWwuXHJcbiAqIEB0eXBlIHt2b2lkfCp8Q2xhc3N8ZXh0ZW5kfGV4dGVuZHxleHRlbmR9XHJcbiAqL1xyXG5pdGVtVk1zLkNvbnNvbGUgPSBJdGVtVk0uZXh0ZW5kKHtcclxuICAgIC8vIGluaXQgZnVuY3Rpb25cclxuICAgIGluaXQ6IGZ1bmN0aW9uKGNvbnNvbGVNb2RlbCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnR5cGUgPSAnQ29uc29sZSc7XHJcbiAgICAgICAgdGhpcy5zaXplID0gY29uc29sZU1vZGVsLnNpemU7XHJcbiAgICAgICAgdGhpcy5tID0gY29uc29sZU1vZGVsO1xyXG4gICAgICAgIHRoaXMucGFyZW50KGNvbnNvbGVNb2RlbC54LCBjb25zb2xlTW9kZWwueSwge30pO1xyXG4gICAgICAgIHRoaXMub25TaGlwKGNvbnNvbGVNb2RlbC5vblNoaXAoKSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIENvbXBvbmVudCB2aWV3IG1vZGVsLlxyXG4gKiBAdHlwZSB7dm9pZHwqfENsYXNzfGV4dGVuZHxleHRlbmR8ZXh0ZW5kfVxyXG4gKi9cclxuaXRlbVZNcy5Db21wb25lbnQgPSBJdGVtVk0uZXh0ZW5kKHtcclxuICAgIC8vIGluaXQgZnVuY3Rpb25cclxuICAgIGluaXQ6IGZ1bmN0aW9uKGNvbXBvbmVudE1vZGVsKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMudHlwZSA9ICdDb21wb25lbnQnO1xyXG4gICAgICAgIHRoaXMuc2l6ZSA9IGNvbXBvbmVudE1vZGVsLnNpemU7XHJcbiAgICAgICAgdGhpcy5tID0gY29tcG9uZW50TW9kZWw7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQoY29tcG9uZW50TW9kZWwueCwgY29tcG9uZW50TW9kZWwueSwge30pO1xyXG4gICAgICAgIC8vIGFkZCBhbmltYXRpb25cclxuICAgICAgICB0aGlzLmFkZEFuaW1hdGlvbignaWRsZScsIFszXSk7XHJcbiAgICAgICAgdGhpcy5hZGRBbmltYXRpb24oJ2NoYXJnZScsIFswLCAxLCAyLCAzLCA0LCA1LCA1XSk7XHJcbiAgICAgICAgLy8gc2V0IGFuaW1hdGlvblxyXG4gICAgICAgIHRoaXMub2ZmU2hpcEFuaW1hdGlvbnMubm9ybWFsID0gJ2lkbGUnO1xyXG4gICAgICAgIHRoaXMub25TaGlwQW5pbWF0aW9ucy5ub3JtYWwgPSAnY2hhcmdlJztcclxuICAgICAgICB0aGlzLmFuaW1hdGlvbnNwZWVkID0gMTU7XHJcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50QW5pbWF0aW9uKCdpZGxlJyk7XHJcbiAgICAgICAgdGhpcy5vblNoaXAoY29tcG9uZW50TW9kZWwub25TaGlwKCkpO1xyXG5cclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogRG9vciB2aWV3IG1vZGVsLlxyXG4gKiBAdHlwZSB7dm9pZHwqfENsYXNzfGV4dGVuZHxleHRlbmR8ZXh0ZW5kfVxyXG4gKi9cclxuaXRlbVZNcy5Eb29yID0gSXRlbVZNLmV4dGVuZCh7XHJcbiAgICAvLyBpbml0IGZ1bmN0aW9uXHJcbiAgICBpbml0OiBmdW5jdGlvbihkb29yTW9kZWwpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy50eXBlID0gJ0Rvb3InO1xyXG4gICAgICAgIHRoaXMuc2l6ZSA9IGRvb3JNb2RlbC5zaXplO1xyXG4gICAgICAgIHRoaXMubSA9IGRvb3JNb2RlbDtcclxuICAgICAgICB0aGlzLnBhcmVudChkb29yTW9kZWwueCwgZG9vck1vZGVsLnksIHt9KTtcclxuXHJcbiAgICAgICAgLy8gYWRkIGFuaW1hdGlvblxyXG4gICAgICAgIHRoaXMuYWRkQW5pbWF0aW9uKCdpZGxlJywgWzJdKTtcclxuICAgICAgICB0aGlzLmFkZEFuaW1hdGlvbigndl9pZGxlJywgWzNdKTtcclxuICAgICAgICB0aGlzLmFkZEFuaW1hdGlvbignaF9vcGVuX2Nsb3NlJyxcclxuICAgICAgICAgICAgWzAsIDIsIDQsIDYsIDgsIDEwLCAxMCwgOCwgNiwgNCwgMiwgMF0pO1xyXG4gICAgICAgIHRoaXMuYWRkQW5pbWF0aW9uKCd2X29wZW5fY2xvc2UnLFxyXG4gICAgICAgICAgICBbMSwgMywgNSwgNywgOSwgMTEsIDExLCA5LCA3LCA1LCAzLCAxXSk7XHJcbiAgICAgICAgdGhpcy5hbmNob3JQb2ludC54ID0gMC4yNTtcclxuICAgICAgICB0aGlzLmFuY2hvclBvaW50LnkgPSAwLjU7XHJcbiAgICAgICAgLy8gc2V0IGFuaW1hdGlvblxyXG4gICAgICAgIHRoaXMub2ZmU2hpcEFuaW1hdGlvbnMubm9ybWFsID0gJ2lkbGUnO1xyXG4gICAgICAgIHRoaXMub2ZmU2hpcEFuaW1hdGlvbnMucm90YXRlZCA9ICd2X2lkbGUnO1xyXG4gICAgICAgIHRoaXMub25TaGlwQW5pbWF0aW9ucy5ub3JtYWwgPSAnaF9vcGVuX2Nsb3NlJztcclxuICAgICAgICB0aGlzLm9uU2hpcEFuaW1hdGlvbnMucm90YXRlZCA9ICd2X29wZW5fY2xvc2UnO1xyXG4gICAgICAgIHRoaXMuYW5pbWF0aW9uc3BlZWQgPSAxMDtcclxuICAgICAgICB0aGlzLnNldEN1cnJlbnRBbmltYXRpb24oJ2lkbGUnKTtcclxuICAgICAgICB0aGlzLnJvdGF0ZWQodGhpcy5tLnJvdGF0ZWQoKSk7IC8vZm9yY2UgY2hhbmdlIGFuZ2xlXHJcbiAgICAgICAgdGhpcy56SW5kZXggPSAxMTA7XHJcbiAgICAgICAgdGhpcy5vblNoaXAoZG9vck1vZGVsLm9uU2hpcCgpKTtcclxuXHJcbiAgICB9XHJcblxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBXYWxsIHZpZXcgbW9kZWwuXHJcbiAqIEB0eXBlIHt2b2lkfCp8Q2xhc3N8ZXh0ZW5kfGV4dGVuZHxleHRlbmR9XHJcbiAqL1xyXG5pdGVtVk1zLldhbGwgPSBJdGVtVk0uZXh0ZW5kKHtcclxuICAgIC8vIGluaXQgZnVuY3Rpb25cclxuICAgIGluaXQ6IGZ1bmN0aW9uKHdhbGxNb2RlbCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnR5cGUgPSAnV2FsbCc7XHJcbiAgICAgICAgdGhpcy5zaXplID0gd2FsbE1vZGVsLnNpemU7XHJcbiAgICAgICAgdGhpcy5tID0gd2FsbE1vZGVsO1xyXG4gICAgICAgIHRoaXMucGFyZW50KHdhbGxNb2RlbC54LCB3YWxsTW9kZWwueSwge30pO1xyXG4gICAgICAgIC8vIGFkZCBhbmltYXRpb25cclxuICAgICAgICAvL1dhbGwgY29ubmVjdHM6IHQ9dG9wLCBsPWxlZnQsIGI9Ym90dG9tLCByPXJpZ2h0XHJcbiAgICAgICAgdGhpcy5hZGRBbmltYXRpb24oJ2xyJywgWzBdKTtcclxuICAgICAgICB0aGlzLmFkZEFuaW1hdGlvbigndGInLCBbMV0pO1xyXG4gICAgICAgIHRoaXMuYWRkQW5pbWF0aW9uKCd0cicsIFsyXSk7XHJcbiAgICAgICAgdGhpcy5hZGRBbmltYXRpb24oJ3RscicsIFszXSk7XHJcbiAgICAgICAgdGhpcy5hZGRBbmltYXRpb24oJ3RsYnInLCBbNF0pO1xyXG4gICAgICAgIHRoaXMuYWRkQW5pbWF0aW9uKCd0bCcsIFs1XSk7XHJcbiAgICAgICAgdGhpcy5hZGRBbmltYXRpb24oJ2JyJywgWzZdKTtcclxuICAgICAgICB0aGlzLmFkZEFuaW1hdGlvbignbGJyJywgWzddKTtcclxuICAgICAgICB0aGlzLmFkZEFuaW1hdGlvbignbGInLCBbOF0pO1xyXG4gICAgICAgIHRoaXMuYWRkQW5pbWF0aW9uKCd0bGInLCBbOV0pO1xyXG4gICAgICAgIHRoaXMuYWRkQW5pbWF0aW9uKCd0YnInLCBbMTBdKTtcclxuICAgICAgICAvLyBzZXQgYW5pbWF0aW9uXHJcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50QW5pbWF0aW9uKCdscicpO1xyXG4gICAgICAgIHRoaXMuYW5pbWF0aW9uc3BlZWQgPSA2O1xyXG4gICAgICAgIHRoaXMub25TaGlwKHdhbGxNb2RlbC5vblNoaXAoKSk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBtb2RlbCBvZiB0aGUgb2JqZWN0IGlmIGl0J3MgYSB2aWV3bW9kZWwsXHJcbiAgICAgKiBvciByZXR1cm5zIHRoZSBvYmplY3QgaXRzZWxmIGlmIGl0J3MgYSBtb2RlbC5cclxuICAgICAqIEBwYXJhbSB7Kn0gb2JqZWN0XHJcbiAgICAgKiBAcmV0dXJuIHtzaC5JdGVtfVxyXG4gICAgICovXHJcbiAgICBnZXRNb2RlbDogZnVuY3Rpb24ob2JqZWN0KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBzaC5JdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBJdGVtVk0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdC5tO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICB1cGRhdGVBbmltYXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgc2NyZWVuID0gbWUuc3RhdGUuY3VycmVudCgpLFxyXG4gICAgICAgICAgICB0b3AgPSBzY3JlZW4uYXQodGhpcy54LCB0aGlzLnkgLSBzaC5HUklEX1NVQiksXHJcbiAgICAgICAgICAgIGxlZnQgPSBzY3JlZW4uYXQodGhpcy54IC0gc2guR1JJRF9TVUIsIHRoaXMueSksXHJcbiAgICAgICAgICAgIGJvdCA9IHNjcmVlbi5hdCh0aGlzLngsIHRoaXMueSArIHNoLkdSSURfU1VCKSxcclxuICAgICAgICAgICAgcmlnaHQgPSBzY3JlZW4uYXQodGhpcy54ICsgc2guR1JJRF9TVUIsIHRoaXMueSksXHJcbiAgICAgICAgICAgIHdhbGxzQXJvdW5kID0gW10sXHJcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU7XHJcbiAgICAgICAgdG9wID0gdGhpcy5nZXRNb2RlbCh0b3ApO1xyXG4gICAgICAgIGxlZnQgPSB0aGlzLmdldE1vZGVsKGxlZnQpO1xyXG4gICAgICAgIGJvdCA9IHRoaXMuZ2V0TW9kZWwoYm90KTtcclxuICAgICAgICByaWdodCA9IHRoaXMuZ2V0TW9kZWwocmlnaHQpO1xyXG4gICAgICAgIHRoaXMubS51cGRhdGVDb25uZWN0aW9ucyh0b3AsIGxlZnQsIGJvdCwgcmlnaHQpO1xyXG4gICAgICAgIGlmICh0aGlzLm0uaXNIb3Jpem9udGFsKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50QW5pbWF0aW9uKCdscicpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm0uaXNWZXJ0aWNhbCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudEFuaW1hdGlvbigndGInKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5tLmNvbm5lY3RlZC50b3ApIHtcclxuICAgICAgICAgICAgd2FsbHNBcm91bmQucHVzaCgndCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5tLmNvbm5lY3RlZC5sZWZ0KSB7XHJcbiAgICAgICAgICAgIHdhbGxzQXJvdW5kLnB1c2goJ2wnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMubS5jb25uZWN0ZWQuYm90dG9tKSB7XHJcbiAgICAgICAgICAgIHdhbGxzQXJvdW5kLnB1c2goJ2InKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMubS5jb25uZWN0ZWQucmlnaHQpIHtcclxuICAgICAgICAgICAgd2FsbHNBcm91bmQucHVzaCgncicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhbmltYXRpb25OYW1lID0gd2FsbHNBcm91bmQuam9pbignJyk7XHJcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50QW5pbWF0aW9uKGFuaW1hdGlvbk5hbWUpO1xyXG4gICAgfSxcclxuICAgIG9uQnVpbHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgcGZNYXRyaXgsIHQsIHVpLCBzaGlwLCBzaXplO1xyXG4gICAgICAgIHRoaXMucGFyZW50KCk7XHJcbiAgICAgICAgdWkgPSBtZS5zdGF0ZS5jdXJyZW50KCk7XHJcbiAgICAgICAgc2hpcCA9IHRoaXMubS5zaGlwO1xyXG4gICAgICAgIHNpemUgPSB7XHJcbiAgICAgICAgICAgIHdpZHRoOiBzaGlwLndpZHRoIC8gc2guR1JJRF9TVUIsXHJcbiAgICAgICAgICAgIGhlaWdodDogc2hpcC5oZWlnaHQgLyBzaC5HUklEX1NVQlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHVpLm1vdXNlTG9ja2VkT24gPT09IHRoaXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwZk1hdHJpeCA9IHNoLnV0aWxzLmdldEVtcHR5TWF0cml4KHNpemUud2lkdGgsIHNpemUuaGVpZ2h0LCAxKTtcclxuICAgICAgICAvL3NlbGYgdGlsZSB3aWxsIGJlIHdhbGthYmxlIGZvciBwYXRoZmluZGluZyBwdXJwb3Nlc1xyXG4gICAgICAgIHBmTWF0cml4W3RoaXMueSAvIHNoLkdSSURfU1VCXVt0aGlzLnggLyBzaC5HUklEX1NVQl0gPSAwO1xyXG4gICAgICAgIF8uZWFjaChwZk1hdHJpeCwgZnVuY3Rpb24ocm93LCB5KSB7XHJcbiAgICAgICAgICAgIF8uZWFjaChwZk1hdHJpeCwgZnVuY3Rpb24odGlsZSwgeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoaXAuaHVsbE1hcFt5XVt4XSA9PT0gc2gudGlsZXMuY2xlYXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBwZk1hdHJpeFt5XVt4XSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYWxwaGEgPSAwLjg7XHJcbiAgICAgICAgaWYgKHVpLmNob3Nlbikge1xyXG4gICAgICAgICAgICB1aS5jaG9zZW4uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0ID0gdGhpcy50ZW1wO1xyXG4gICAgICAgIHQuZ3JpZCA9IG5ldyBQRi5HcmlkKHNpemUud2lkdGgsIHNpemUuaGVpZ2h0LCBwZk1hdHJpeCk7XHJcbiAgICAgICAgdC5wcmVNb3VzZVggPSB0aGlzLng7XHJcbiAgICAgICAgdC5wcmVNb3VzZVkgPSB0aGlzLnk7XHJcbiAgICAgICAgdC5waXZvdFggPSB0aGlzLng7XHJcbiAgICAgICAgdC5waXZvdFkgPSB0aGlzLnk7XHJcbiAgICAgICAgdC5wYXRoID0gbnVsbDtcclxuICAgICAgICB0LmZpbmRlciA9IG5ldyBQRi5CZXN0Rmlyc3RGaW5kZXIoKTtcclxuICAgICAgICB1aS5tb3VzZUxvY2tlZE9uID0gdGhpcztcclxuICAgIH0sXHJcbiAgICBsb2NrZWRNb3VzZU1vdmU6IGZ1bmN0aW9uKG1vdXNlVGlsZSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgdCwgY2xvbmVkR3JpZCwgdWk7XHJcbiAgICAgICAgdWkgPSBtZS5zdGF0ZS5jdXJyZW50KCk7XHJcbiAgICAgICAgdCA9IHRoaXMudGVtcDtcclxuXHJcbiAgICAgICAgaWYgKG1vdXNlVGlsZS54ID09PSB0LnByZU1vdXNlWCAmJiBtb3VzZVRpbGUueSA9PT0gdC5wcmVNb3VzZVkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0LnByZU1vdXNlWCA9IG1vdXNlVGlsZS54O1xyXG4gICAgICAgIHQucHJlTW91c2VZID0gbW91c2VUaWxlLnk7XHJcbiAgICAgICAgdWkuY2xlYXIoKTtcclxuICAgICAgICBpZiAobW91c2VUaWxlLnggPT09IHQucGl2b3RYICYmIG1vdXNlVGlsZS55ID09PSB0LnBpdm90WSkge1xyXG4gICAgICAgICAgICB0LnBhdGggPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNsb25lZEdyaWQgPSB0LmdyaWQuY2xvbmUoKTtcclxuICAgICAgICB0LnBhdGggPSB0LmZpbmRlci5maW5kUGF0aCh0LnBpdm90WCAvIHNoLkdSSURfU1VCLCB0LnBpdm90WSAvXHJcbiAgICAgICAgICAgIHNoLkdSSURfU1VCLCBtb3VzZVRpbGUueCAvIHNoLkdSSURfU1VCLCBtb3VzZVRpbGUueSAvIHNoLkdSSURfU1VCLFxyXG4gICAgICAgICAgICBjbG9uZWRHcmlkKTtcclxuICAgICAgICBfLmVhY2godC5wYXRoLCBmdW5jdGlvbihwLCBpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB1aS5kcmF3SXRlbShwWzBdICogc2guR1JJRF9TVUIsIHBbMV0gKiBzaC5HUklEX1NVQiwgJ1dhbGwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGxvY2tlZE1vdXNlVXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgdWkgPSBtZS5zdGF0ZS5jdXJyZW50KCk7XHJcbiAgICAgICAgXy5lYWNoKHVpLmRyYXdpbmdTY3JlZW4sIGZ1bmN0aW9uKHdhbGwpIHtcclxuICAgICAgICAgICAgdWkuc2hpcC5idWlsZEF0KHdhbGwueCwgd2FsbC55LCAnV2FsbCcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYWxwaGEgPSAxO1xyXG4gICAgICAgIGlmICh1aS5jaG9zZW4pIHtcclxuICAgICAgICAgICAgdWkuY2hvc2VuLmFscGhhID0gMC44O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRlbXAgPSB7fTtcclxuICAgICAgICB1aS5jbGVhcigpO1xyXG4gICAgICAgIHVpLm1vdXNlTG9ja2VkT24gPSBudWxsO1xyXG4gICAgfSxcclxuICAgIGxvY2tlZE1vdXNlRG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfSxcclxuICAgIGxvY2tlZEVzY2FwZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB1aSA9IG1lLnN0YXRlLmN1cnJlbnQoKTtcclxuICAgICAgICB1aS5jbGVhcigpO1xyXG4gICAgICAgIGlmICh1aS5jaG9zZW4pIHtcclxuICAgICAgICAgICAgdWkuY2hvc2VuLmFscGhhID0gMC44O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRlbXAgPSB7fTtcclxuICAgICAgICB1aS5tb3VzZUxvY2tlZE9uID0gbnVsbDtcclxuICAgICAgICB1aS5zaGlwLnJlbW92ZSh0aGlzLm0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBXZWFrU3BvdCB2aWV3IG1vZGVsLlxyXG4gKiBAdHlwZSB7dm9pZHwqfENsYXNzfGV4dGVuZHxleHRlbmR8ZXh0ZW5kfVxyXG4gKi9cclxuaXRlbVZNcy5XZWFrU3BvdCA9IEl0ZW1WTS5leHRlbmQoe1xyXG4gICAgLy8gaW5pdCBmdW5jdGlvblxyXG4gICAgaW5pdDogZnVuY3Rpb24oY29uc29sZU1vZGVsKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMudHlwZSA9ICdXZWFrU3BvdCc7XHJcbiAgICAgICAgdGhpcy5zaXplID0gY29uc29sZU1vZGVsLnNpemU7XHJcbiAgICAgICAgdGhpcy5tID0gY29uc29sZU1vZGVsO1xyXG4gICAgICAgIHRoaXMucGFyZW50KGNvbnNvbGVNb2RlbC54LCBjb25zb2xlTW9kZWwueSwge30pO1xyXG4gICAgICAgIHRoaXMub25TaGlwKGNvbnNvbGVNb2RlbC5vblNoaXAoKSk7XHJcbiAgICAgICAgLy90aGlzLnNldFRyYW5zcGFyZW5jeSgnQTE3RkZGJyk7XHJcbiAgICAgICAgdGhpcy5hbHBoYSA9IDAuNzU7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFRlbGVwb3J0ZXIgdmlldyBtb2RlbC5cclxuICogQHR5cGUge3ZvaWR8KnxDbGFzc3xleHRlbmR8ZXh0ZW5kfGV4dGVuZH1cclxuICovXHJcbml0ZW1WTXMuVGVsZXBvcnRlciA9IEl0ZW1WTS5leHRlbmQoe1xyXG4gICAgLy8gaW5pdCBmdW5jdGlvblxyXG4gICAgaW5pdDogZnVuY3Rpb24obW9kZWwpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy50eXBlID0gJ1RlbGVwb3J0ZXInO1xyXG4gICAgICAgIHRoaXMuc2l6ZSA9IG1vZGVsLnNpemU7XHJcbiAgICAgICAgdGhpcy5tID0gbW9kZWw7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQobW9kZWwueCwgbW9kZWwueSwge30pO1xyXG4gICAgICAgIHRoaXMub25TaGlwKG1vZGVsLm9uU2hpcCgpKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5leHBvcnRzLkl0ZW1WTSA9IEl0ZW1WTTtcclxuZXhwb3J0cy5pdGVtVk1zID0gaXRlbVZNczsiLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIG1lKi9cclxuXHJcbm1lLnBsdWdpbi5wYXRjaChtZS5UTVhUaWxlTWFwLCAnbG9hZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdGhpcy5wYXJlbnQoKTtcclxuICAgIHRoaXMubWFwTGF5ZXJzLnB1c2gobmV3IG1lLkNvbG9yTGF5ZXIoJ2JhY2tncm91bmRfY29sb3InLCAnIzAwMDAwMCcsXHJcbiAgICAgICAgdGhpcy56IC0gMTApKTtcclxufSk7XHJcblxyXG4vKipcclxuICogRGlzYWJsZSBNZWxvbkpTIHBhdXNlIGZ1bmN0aW9uIGZvciB3aGVuIGZvY3VzIGlzIGF3YXkuXHJcbiAqIEByZXR1cm4ge2ludH1cclxuICovXHJcbm1lLnN0YXRlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEaXNhYmxlIE1lbG9uSlMgcmVzdW1lIGZ1bmN0aW9uLlxyXG4gKiBAcmV0dXJuIHtpbnR9XHJcbiAqL1xyXG5tZS5zdGF0ZS5yZXN1bWUgPSBmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuICAgIHJldHVybiAwO1xyXG59O1xyXG5cclxuIiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIG1lKi9cclxuXHJcbnZhciBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLl8sXHJcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICAgIGdzID0gcmVxdWlyZSgnLi9nYW1lLXN0YXRlJyksXHJcbiAgICBUSUxFX1NJWkUgPSBncy5USUxFX1NJWkUsXHJcbiAgICBzaCA9IHJlcXVpcmUoJ3NoYXJlZCcpO1xyXG5cclxuLyogQW4gb2JqZWN0IHRoYXQgaGFzIHRpbGUgcG9zaXRpb24gKHggYW5kIHkpLFxyXG4gYW5kIHJvdyBsZW5ndGggYW5kIGNvbCBsZW5ndGggdGhyb3VnaCBcInNpemVcIlxyXG4gKi9cclxudmFyIFRpbGVFbnRpdHlWTSA9IG1vZHVsZS5leHBvcnRzID0gbWUuT2JqZWN0RW50aXR5LmV4dGVuZCh7XHJcbiAgICB4OiAwLCAvL2NvbHVtblxyXG4gICAgeTogMCwgLy9yb3dcclxuICAgIHNpemU6IFsxLCAxXSxcclxuICAgIGNhbm5vblRpbGU6IFswLCAwXSwgLy9pbWFnZSBvZmZzZXRcclxuICAgIGlzU2VsZWN0YWJsZTogZmFsc2UsXHJcbiAgICBpbml0OiBmdW5jdGlvbih4LCB5LCBzZXR0aW5ncykge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgdHlwZSwgc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnNjcmVlbiA9IG1lLnN0YXRlLmN1cnJlbnQoKTtcclxuICAgICAgICBpZiAodGhpcy50eXBlICE9PSAwKSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSB0aGlzLnR5cGU7XHJcbiAgICAgICAgICAgIHNldHRpbmdzLmltYWdlID0gdGhpcy50eXBlLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy50b3RhbFNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy50b3RhbFNpemUgPSBbdGhpcy5zaXplWzBdLCB0aGlzLnNpemVbMV1dO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2V0dGluZ3Muc3ByaXRld2lkdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBzZXR0aW5ncy5zcHJpdGV3aWR0aCA9IHRoaXMudG90YWxTaXplWzBdICogVElMRV9TSVpFO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc2V0dGluZ3Muc3ByaXRlaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgc2V0dGluZ3Muc3ByaXRlaGVpZ2h0ID0gdGhpcy50b3RhbFNpemVbMV0gKiBUSUxFX1NJWkU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGFyZW50KHgsIHksIHNldHRpbmdzKTtcclxuICAgICAgICAvL3Jlc3RvcmUgdHlwZSByZXNldCBvbiB0aGlzLnBhcmVudCgpXHJcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgICAgICB0aGlzLnNldFgoeCk7XHJcbiAgICAgICAgdGhpcy5zZXRZKHkpO1xyXG5cclxuICAgICAgICBtZS5pbnB1dC5yZWdpc3Rlck1vdXNlRXZlbnQoJ21vdXNlZG93bicsIHRoaXMsXHJcbiAgICAgICAgICAgIHRoaXMub25Nb3VzZURvd24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgbWUuaW5wdXQucmVnaXN0ZXJNb3VzZUV2ZW50KCdtb3VzZXVwJywgdGhpcyxcclxuICAgICAgICAgICAgdGhpcy5vbk1vdXNlVXAuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5zZWxlY3Rpb25Db2xvcikge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbkNvbG9yID0gJ3RlYWwnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxlY3RlZDtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKCFfLmNvbnRhaW5zKGdzLnNlbGVjdGVkLCB0aGlzKSkge1xyXG4gICAgICAgICAgICAgICAgZ3Muc2VsZWN0ZWQucHVzaCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9uU2VsZWN0ZWQoKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMuZGVzZWxlY3QgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgc2gudXRpbHMucmVtb3ZlRnJvbUFycmF5KHRoaXMsIGdzLnNlbGVjdGVkKTtcclxuICAgICAgICAgICAgdGhpcy5vbkRlc2VsZWN0ZWQoKTtcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMucGFyZW50KCk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3RhYmxlICYmIHRoaXMuaXNNb3VzZU92ZXIpIHtcclxuICAgICAgICAgICAgdXRpbHMuc2V0Q3Vyc29yKCdwb2ludGVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9jY3VwaWVzKHV0aWxzLmxhc3RNb3VzZSkpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzTW91c2VPdmVyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTW91c2VFbnRlcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc01vdXNlT3ZlciA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc01vdXNlT3Zlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbk1vdXNlTGVhdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNNb3VzZU92ZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBkcmF3OiBmdW5jdGlvbihjdHgpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQoY3R4KTtcclxuICAgICAgICBpZiAodGhpcy5pc1NlbGVjdGFibGUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U2VsZWN0ZWRIaWdodGxpZ2h0KGN0eCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc01vdXNlT3Zlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3SG92ZXJIaWdobGlnaHQoY3R4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBkcmF3SG92ZXJIaWdobGlnaHQ6IGZ1bmN0aW9uKGN0eCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odGhpcy5wb3MueCwgdGhpcy5wb3MueSk7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QodGhpcy5wb3MueCwgdGhpcy5wb3MueSwgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQpO1xyXG4gICAgfSxcclxuICAgIGRyYXdTZWxlY3RlZEhpZ2h0bGlnaHQ6IGZ1bmN0aW9uKGN0eCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnNlbGVjdGlvbkNvbG9yO1xyXG4gICAgICAgIGN0eC5saW5lV2lkdGggPSAyO1xyXG4gICAgICAgIGN0eC5tb3ZlVG8odGhpcy5wb3MueCwgdGhpcy5wb3MueSk7XHJcbiAgICAgICAgY3R4LnN0cm9rZVJlY3QodGhpcy5wb3MueCwgdGhpcy5wb3MueSwgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQpO1xyXG4gICAgfSxcclxuICAgIG9uTW91c2VEb3duOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuICcnOy8vZm9yIGpzTGludFxyXG4gICAgfSxcclxuICAgIG9uTW91c2VVcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICh0aGlzLmlzU2VsZWN0YWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBvbk1vdXNlRW50ZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gJyc7Ly9mb3IganNMaW50XHJcbiAgICB9LFxyXG4gICAgb25Nb3VzZUxlYXZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNTZWxlY3RhYmxlKSB7XHJcbiAgICAgICAgICAgIHV0aWxzLnNldEN1cnNvcignZGVmYXVsdCcpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBvblNlbGVjdGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuICcnOy8vZm9yIGpzTGludFxyXG4gICAgfSxcclxuICAgIG9uRGVzZWxlY3RlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiAnJzsvL2ZvciBqc0xpbnRcclxuICAgIH0sXHJcbiAgICBzZXRYOiBmdW5jdGlvbih4KSB7IC8vc2V0cyB0aGUgY29sdW1uIGF0IHdoaWNoIGl0IGlzIGxvY2F0ZWRcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKHggPT09IHRoaXMueCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0geDtcclxuICAgICAgICB0aGlzLnBvcy54ID0gKHRoaXMueCAtIHRoaXMuY2Fubm9uVGlsZVswXSkgKiBUSUxFX1NJWkU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgc2V0WTogZnVuY3Rpb24oeSkgeyAvL3NldHMgdGhlIHJvd1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAoeSA9PT0gdGhpcy55KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIHRoaXMucG9zLnkgPSAodGhpcy55IC0gdGhpcy5jYW5ub25UaWxlWzFdKSAqIFRJTEVfU0laRTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH0sXHJcbiAgICBfaGlkZGVuOiBmYWxzZSxcclxuICAgIGhpZGRlbjogZnVuY3Rpb24oaGlkZSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAoaGlkZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oaWRkZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChoaWRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWxwaGEgPSAwO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWxwaGEgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9oaWRkZW4gPSBoaWRlO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIHNob3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLmhpZGRlbihmYWxzZSk7XHJcbiAgICAgICAgaWYgKHRoaXMud2FzU2VsZWN0YWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmlzU2VsZWN0YWJsZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLmhpZGRlbih0cnVlKTtcclxuICAgICAgICBpZiAodGhpcy5pc1NlbGVjdGFibGUpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWQoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZXNlbGVjdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMud2FzU2VsZWN0YWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuaXNTZWxlY3RhYmxlID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSxcclxuICAgIHRydWVTaXplOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICAvLyhvbmx5IGl0ZW1zIGNhbiByb3RhdGUsIG5vdCB1bml0cylcclxuICAgICAgICByZXR1cm4gdGhpcy5zaXplW2luZGV4XTtcclxuICAgIH0sXHJcbiAgICBvY2N1cGllczogZnVuY3Rpb24odGlsZSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgeCA9IHRpbGUueCwgeSA9IHRpbGUueTtcclxuICAgICAgICByZXR1cm4geCA+PSB0aGlzLnggJiYgeCA8IHRoaXMueCArIHRoaXMudHJ1ZVNpemUoMCkgJiZcclxuICAgICAgICAgICAgeSA+PSB0aGlzLnkgJiYgeSA8IHRoaXMueSArIHRoaXMudHJ1ZVNpemUoMSk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBDaG9vc2Ugd2hpY2ggcHJvcGVydGllcyB3b3VsZCBiZSB0cmFja2VkIHRvXHJcbiAgICAgKiBiZSBzdG9yZWQgaW4gJ2NoYW5nZWQnLlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gcHJvcGVydGllc1xyXG4gICAgICovXHJcbiAgICBzZXRUcmFja2VkOiBmdW5jdGlvbihwcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMucHJldk1vZGVsU3RhdGUgPSB7fTtcclxuICAgICAgICBfLmVhY2gocHJvcGVydGllcywgZnVuY3Rpb24ocCkge1xyXG4gICAgICAgICAgICB0aGlzLnByZXZNb2RlbFN0YXRlW3BdID0gdGhpcy5tW3BdO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeU1vZGVsQ2hhbmdlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBjaGFuZ2VkID0ge307XHJcbiAgICAgICAgXy5lYWNoKHRoaXMucHJldk1vZGVsU3RhdGUsIGZ1bmN0aW9uKHZhbHVlLCBwcm9wTmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5tW3Byb3BOYW1lXSAhPT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZWRbcHJvcE5hbWVdID0ge3ByZXZpb3VzOiBzZWxmLnByZXZNb2RlbFN0YXRlW3Byb3BOYW1lXX07XHJcbiAgICAgICAgICAgICAgICAvL3VwZGF0ZSBwcmV2aW91cyBtb2RlbCBzdGF0ZVxyXG4gICAgICAgICAgICAgICAgc2VsZi5wcmV2TW9kZWxTdGF0ZVtwcm9wTmFtZV0gPSBzZWxmLm1bcHJvcE5hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKF8uc2l6ZShjaGFuZ2VkKSA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5vbk1vZGVsQ2hhbmdlZChjaGFuZ2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgb25Nb2RlbENoYW5nZWQ6IGZ1bmN0aW9uKGNoYW5nZWQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgLy8ob3ZlcnJpZGUgdGhpcyBmdW5jdGlvbilcclxuICAgICAgICByZXR1cm4gY2hhbmdlZDtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIE9uRGVzdHJveSBub3RpZmljYXRpb24gZnVuY3Rpb248YnI+XHJcbiAgICAgKiBDYWxsZWQgYnkgZW5naW5lIGJlZm9yZSBkZWxldGluZyB0aGUgb2JqZWN0PGJyPlxyXG4gICAgICogYmUgc3VyZSB0byBjYWxsIHRoZSBwYXJlbnQgZnVuY3Rpb24gaWYgb3ZlcndyaXR0ZW5cclxuICAgICAqL1xyXG4gICAgb25EZXN0cm95RXZlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudCgpO1xyXG4gICAgICAgIG1lLmlucHV0LnJlbGVhc2VNb3VzZUV2ZW50KCdtb3VzZWRvd24nLCB0aGlzKTtcclxuICAgICAgICBtZS5pbnB1dC5yZWxlYXNlTW91c2VFdmVudCgnbW91c2V1cCcsIHRoaXMpO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCByZXF1aXJlLCBtb2R1bGUsIG1lKi9cclxuXHJcbnZhciBUaWxlRW50aXR5Vk0gPSByZXF1aXJlKCcuL3RpbGUtZW50aXR5LXZtJyksXHJcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xyXG5cclxudmFyIHVpID0gbW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICB2YXIgdWkgPSB7fTtcclxuICAgIC8qKlxyXG4gICAgICogQSB0cmFuc3BhcmVudCByZWQgb3ZlcmxheS5cclxuICAgICAqIEB0eXBlIHsqfVxyXG4gICAgICovXHJcbiAgICB1aS5SZWRDb2xvckVudGl0eSA9IFRpbGVFbnRpdHlWTS5leHRlbmQoe1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgICAgICAgdGhpcy5zaXplID0gWzEsIDFdO1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudCh4LCB5LCB7XHJcbiAgICAgICAgICAgICAgICBpbWFnZTogJ3NlbGVjdG9yJyxcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdyZWQnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWFrZXMgdGhlIG9iamVjdCBmYWRlIGEgbGl0dGxlLiAoVXNlIG9uIG9iamVjdHMnIHVwZGF0ZSB0b1xyXG4gICAgICogbWFrZSBpdCBmYWRlIHVudGlsIGl0IGRpc2FwcGVhcnMpLlxyXG4gICAgICogQHBhcmFtIHsqfSBvYmplY3QgVGhlIG9iamVjdCB0byBmYWRlLlxyXG4gICAgICogQHBhcmFtIHt7ZHVyYXRpb246aW50LCBzdGVwOmZsb2F0fX0gc2V0dGluZ3NcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZmFkZShvYmplY3QsIHNldHRpbmdzKSB7XHJcbiAgICAgICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHNldHRpbmdzIHx8IHt9LCB7ZHVyYXRpb246IDMwLCBzdGVwOiAwLjAzfSk7XHJcbiAgICAgICAgaWYgKG9iamVjdC5mYWRlQ291bnRkb3duID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgb2JqZWN0LmZhZGVDb3VudGRvd24gPSBzZXR0aW5ncy5kdXJhdGlvbjtcclxuICAgICAgICB9XHJcbiAgICAgICAgb2JqZWN0LmFscGhhIC09IHNldHRpbmdzLnN0ZXA7XHJcbiAgICAgICAgb2JqZWN0LmZhZGVDb3VudGRvd24tLTtcclxuICAgICAgICBpZiAob2JqZWN0LmZhZGVDb3VudGRvd24gPT09IDApIHtcclxuICAgICAgICAgICAgbWUuZ2FtZS5yZW1vdmUob2JqZWN0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdWkuU2hpcERhbWFnZU92ZXJsYXkgPSBtZS5PYmplY3RFbnRpdHkuZXh0ZW5kKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy90aGUgcGl2b3QgZG9lc24ndCBtb3ZlXHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KDAsIDAsIHtpbWFnZTogJ25vdGhpbmcnfSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWxwaGEgPSAwLjU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkcmF3OiBmdW5jdGlvbihjdHgpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoY3R4KTtcclxuICAgICAgICAgICAgY3R4LnNhdmUoKTtcclxuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9ICdyZWQnO1xyXG4gICAgICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSB0aGlzLmFscGhhO1xyXG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoMCwgMCwgY3R4LmNhbnZhcy53aWR0aCwgY3R4LmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICBjdHgucmVzdG9yZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoKTtcclxuICAgICAgICAgICAgZmFkZSh0aGlzLCB7ZHVyYXRpb246IDEwfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvKipcclxuICAgICAqIEEgZHJhZy1ib3ggdG8gc2VsZWN0IHVuaXRzLlxyXG4gICAgICogQHR5cGUgeyp9XHJcbiAgICAgKi9cclxuICAgIHVpLkRyYWdCb3ggPSBtZS5SZWN0LmV4dGVuZCh7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge21lLlZlY3RvcjJkfSBwaXZvdCBUaGUgcGl2b3QgcG9zaXRpb24uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24ocGl2b3QpIHtcclxuICAgICAgICAgICAgLy90aGUgcGl2b3QgZG9lc24ndCBtb3ZlXHJcbiAgICAgICAgICAgIHRoaXMucGl2ID0gcGl2b3Q7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KG5ldyBtZS5WZWN0b3IyZChwaXZvdC54LCBwaXZvdC55KSwgMSwgMSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkcmF3OiBmdW5jdGlvbihjdHgpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoY3R4KTtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJ2JsdWUnO1xyXG4gICAgICAgICAgICBjdHgubGluZVdpZHRoID0gMjtcclxuICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QodGhpcy5wb3MueCwgdGhpcy5wb3MueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlRnJvbU1vdXNlOiBmdW5jdGlvbihtb3VzZSkge1xyXG4gICAgICAgICAgICBpZiAobW91c2UueCA+IHRoaXMucGl2LngpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSBtb3VzZS54IC0gdGhpcy5waXYueDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vdGhlIHdpZHRoIG11c3Qgbm90IGhhdmUgbmVnYXRpdmUgdmFsdWVzIG9yXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgdGhlICdjb250YWlucycgbWV0aG9kIHdvdWxkIG5vdCB3b3JrXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcy54ID0gbW91c2UueDtcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLnBpdi54IC0gbW91c2UueDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1vdXNlLnkgPiB0aGlzLnBpdi55KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IG1vdXNlLnkgLSB0aGlzLnBpdi55O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy90aGUgaGVpZ2h0IG11c3Qgbm90IGhhdmUgbmVnYXRpdmUgdmFsdWVzIG9yXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgdGhlICdjb250YWlucycgbWV0aG9kIHdvdWxkIG5vdCB3b3JrXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcy55ID0gbW91c2UueTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5waXYueSAtIG1vdXNlLnk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgbGl0dGxlIHN0YXIgdGhhdCBzaG93cyB1cCB3aGVuIGEgbWVsZWUgaGl0IG9jY3Vycy5cclxuICAgICAqIEB0eXBlIHsqfVxyXG4gICAgICovXHJcbiAgICB1aS5TdGFySGl0ID0gbWUuT2JqZWN0RW50aXR5LmV4dGVuZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24odW5pdFZNKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KHVuaXRWTS5wb3MueCAtIDgsIHVuaXRWTS5wb3MueSAtIDgsXHJcbiAgICAgICAgICAgICAgICB7aW1hZ2U6ICdzdGFyX2hpdF93aGl0ZScsIHNwcml0ZXdpZHRoOiAxNiwgc3ByaXRlaGVpZ2h0OiAxNixcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnc3Rhcl9oaXQnfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudCgpO1xyXG4gICAgICAgICAgICBmYWRlKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgbnVtYmVyIHRoYXQgZmxvYXRzIHVwd2FyZHMuXHJcbiAgICAgKiBAdHlwZSB7Kn1cclxuICAgICAqL1xyXG4gICAgdWkuRmxvYXRpbmdOdW1iZXIgPSBtZS5PYmplY3RFbnRpdHkuZXh0ZW5kKHtcclxuICAgICAgICBmb250T2JqZWN0OiBudWxsLFxyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKHBvcywgdmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIGNvbG9yO1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChwb3MueCwgcG9zLnksIHtpbWFnZTogJ25vdGhpbmcnfSk7XHJcbiAgICAgICAgICAgIHRoaXMucG9zID0gcG9zO1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsT2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBjb2xvciA9IHZhbHVlIDwgMCA/ICdyZWQnIDogJ2dyZWVuJztcclxuICAgICAgICAgICAgdGhpcy5mb250T2JqZWN0ID0gbmV3IG1lLkZvbnQoJ0x1Y2lkYSBDb25zb2xlJywgMTQsIGNvbG9yKTtcclxuICAgICAgICAgICAgLy90aGlzLmZvbnRPYmplY3QuYm9sZCgpO1xyXG5cclxuICAgICAgICB9LFxyXG4gICAgICAgIGRyYXc6IGZ1bmN0aW9uKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoY29udGV4dCk7XHJcbiAgICAgICAgICAgIGNvbnRleHQuc2F2ZSgpO1xyXG4gICAgICAgICAgICBjb250ZXh0Lmdsb2JhbEFscGhhID0gdGhpcy5hbHBoYTtcclxuICAgICAgICAgICAgdGhpcy5mb250T2JqZWN0LmRyYXcobWUudmlkZW8uZ2V0U2NyZWVuQ29udGV4dCgpLFxyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZSwgdGhpcy5wb3MueCwgdGhpcy5wb3MueSArIHRoaXMudmVydGljYWxPZmZzZXQpO1xyXG4gICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljYWxPZmZzZXQgLT0gMC4zOy8vZ29lcyB1cCBhIGxpdHRsZS5cclxuICAgICAgICAgICAgZmFkZSh0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEEgYnV0dG9uIHdpdGggdGV4dC5cclxuICAgICAqIEB0eXBlIHsqfVxyXG4gICAgICovXHJcbiAgICB1aS5CdXR0b24gPSBtZS5HVUlfT2JqZWN0LmV4dGVuZCh7XHJcbiAgICAgICAgZm9udE9iamVjdDogbnVsbCxcclxuICAgICAgICB0ZXh0OiAnJyxcclxuICAgICAgICBpbml0OiBmdW5jdGlvbih0ZXh0LCB4LCB5LCBzZXR0aW5ncykge1xyXG4gICAgICAgICAgICBpZiAoIXNldHRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncyA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghc2V0dGluZ3MuaW1hZ2UpIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmltYWdlID0gJ2J1dHRvbic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFzZXR0aW5ncy5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5uYW1lID0gJ2J1dHRvbic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoeCwgeSwgc2V0dGluZ3MpO1xyXG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xyXG4gICAgICAgICAgICB0aGlzLnNldFRyYW5zcGFyZW5jeSgnI0ZGRkZGRicpO1xyXG4gICAgICAgICAgICB0aGlzLmZvbnRPYmplY3QgPSBuZXcgbWUuRm9udCgnQXJpYWwnLCAxNiwgJ3doaXRlJyk7XHJcbiAgICAgICAgICAgIHRoaXMuZm9udE9iamVjdC5ib2xkKCk7XHJcblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZHJhdzogZnVuY3Rpb24oY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChjb250ZXh0KTtcclxuICAgICAgICAgICAgdGhpcy5mb250T2JqZWN0LmRyYXcobWUudmlkZW8uZ2V0U2NyZWVuQ29udGV4dCgpLFxyXG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0LCB0aGlzLnBvcy54ICsgMjAsIHRoaXMucG9zLnkgKyAyNCk7XHJcbiAgICAgICAgfS8qLFxyXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIH0qL1xyXG4gICAgfSk7XHJcblxyXG4gICAgdWkuQ2hhcmdpbmdXZWFwb25JY29uID0gbWUuT2JqZWN0RW50aXR5LmV4dGVuZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24odW5pdFZNKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KHVuaXRWTS5wb3MueCAtIDgsIHVuaXRWTS5wb3MueSAtIDgsIHtcclxuICAgICAgICAgICAgICAgIGltYWdlOiAnY2hhcmdpbmctd2VhcG9uLWljb24nLFxyXG4gICAgICAgICAgICAgICAgc3ByaXRld2lkdGg6IDE2LFxyXG4gICAgICAgICAgICAgICAgc3ByaXRlaGVpZ2h0OiAxNlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5hbHBoYSA9IDAuODtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2ZvciB0aGUgeiBpbmRleFxyXG4gICAgdWkubGF5ZXJzID0ge1xyXG4gICAgICAgIGl0ZW1zOiAxMCxcclxuICAgICAgICBjb2xvck92ZXJsYXk6IDIwLFxyXG4gICAgICAgIHVuaXRzOiAzMCxcclxuICAgICAgICBlZmZlY3RzOiA0MCxcclxuICAgICAgICBpbmRpY2F0b3JzOiA1MFxyXG4gICAgfTtcclxuICAgIHJldHVybiB1aTtcclxufSgpKTtcclxuXHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBtZSwgXywgVElMRV9TSVpFKi9cclxudmFyIHNoID0gcmVxdWlyZSgnc2hhcmVkJyksXHJcbiAgICBncyA9IHJlcXVpcmUoJy4vZ2FtZS1zdGF0ZScpO1xyXG5cclxudmFyIHV0aWxzID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRQYXJhbWV0ZXJCeU5hbWU6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIG1hdGNoID0gbmV3IFJlZ0V4cCgnWz8mXScgKyBuYW1lICsgJz0oW14mXSopJylcclxuICAgICAgICAgICAgLmV4ZWMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XHJcbiAgICAgICAgcmV0dXJuIG1hdGNoICYmIGRlY29kZVVSSUNvbXBvbmVudChtYXRjaFsxXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XHJcbiAgICB9LFxyXG4gICAgdG9UaWxlVmVjdG9yOiBmdW5jdGlvbih2ZWN0b3IyRCwgdGlsZVNpemUpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHYgPSBuZXcgbWUuVmVjdG9yMmQoKTtcclxuICAgICAgICB2LnggPSBNYXRoLmZsb29yKHZlY3RvcjJELnggLyB0aWxlU2l6ZSk7XHJcbiAgICAgICAgdi55ID0gTWF0aC5mbG9vcih2ZWN0b3IyRC55IC8gdGlsZVNpemUpO1xyXG4gICAgICAgIHJldHVybiB2O1xyXG4gICAgfSxcclxuICAgIC8vcmV0dXJucyB0aGUgdGlsZSBwb3NpdGlvbiBvZiB0aGUgbW91c2VcclxuICAgIGdldE1vdXNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHRpbGUgPSB1dGlscy50b1RpbGVWZWN0b3IodXRpbHMuZ2V0TW91c2VQeCgpLCBncy5USUxFX1NJWkUpO1xyXG4gICAgICAgIHRoaXMubGFzdE1vdXNlID0gdGlsZTtcclxuICAgICAgICByZXR1cm4gdGlsZTtcclxuICAgIH0sXHJcbiAgICBnZXRNb3VzZVB4OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKCFtZS5nYW1lLmN1cnJlbnRMZXZlbC5pbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBcIlRoZXJlJ3Mgbm8gbGV2ZWwgdG8gZ2V0IHRoZSBtb3VzZVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcHhQb3MgPSBzaC52LnN1YihtZS5pbnB1dC5tb3VzZS5wb3MsIG1lLmdhbWUuY3VycmVudExldmVsLnBvcyk7XHJcbiAgICAgICAgdGhpcy5sYXN0TW91c2VQeCA9IHB4UG9zO1xyXG4gICAgICAgIHJldHVybiBweFBvcztcclxuICAgIH0sXHJcbiAgICBzZXRDdXJzb3I6IGZ1bmN0aW9uKGN1cnNvcikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAoY3Vyc29yICE9PSB0aGlzLmN1cnJlbnRDdXJzb3IpIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2pzYXBwJykuc3R5bGUuY3Vyc29yID0gY3Vyc29yO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDdXJzb3IgPSBjdXJzb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGlzTWluZTogZnVuY3Rpb24ob2JqZWN0KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBvd25lcklEID0gb2JqZWN0Lm93bmVySUQ7XHJcbiAgICAgICAgaWYgKG93bmVySUQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBvd25lcklEID0gb2JqZWN0Lm93bmVyLmlkO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZ3MucGxheWVyLmlkID09PSBvd25lcklEO1xyXG4gICAgfSxcclxuICAgIGlzRW5lbXk6IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gIXV0aWxzLmlzTWluZShvYmplY3QpO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIG5ldyB2aWV3IG1vZGVsIGFjY29yZGluZyB0byB0aGUgbW9kZWwncyB0eXBlLlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1vZGVsXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBEZWZhdWx0Q29uc3RydWN0b3JcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSB2bUNvbnN0cnVjdG9yc1xyXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxyXG4gICAgICovXHJcbiAgICBtYWtlVk06IGZ1bmN0aW9uKG1vZGVsLCBEZWZhdWx0Q29uc3RydWN0b3IsIHZtQ29uc3RydWN0b3JzKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICghdm1Db25zdHJ1Y3RvcnMpIHtcclxuICAgICAgICAgICAgdm1Db25zdHJ1Y3RvcnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZtQ29uc3RydWN0b3JzW21vZGVsLnR5cGVdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgdm1Db25zdHJ1Y3RvcnNbbW9kZWwudHlwZV0obW9kZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRDb25zdHJ1Y3Rvcihtb2RlbCk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIG9yIHJlbW92ZXMgVk1zIGZyb20gTWVsb25KUyBlbmdpbmVcclxuICAgICAqIGFuZCBmcm9tIHRoZSB2bXMgYXJyYXksIHNvIGl0IG1hdGNoZXMgdGhlIG1vZGVscyBhcnJheS5cclxuICAgICAqIEBwYXJhbSB7e21vZGVsczpBcnJheSwgdm1zOkFycmF5LCB6SW5kZXg6aW50LCBhZGRUb0dhbWU6Ym9vbCxcclxuICAgICAqIHZtQ29uc3RydWN0b3JzOk9iamVjdCwgRGVmYXVsdENvbnN0cnVjdG9yOkZ1bmN0aW9uLFxyXG4gICAgICogbWFrZVZNOiBGdW5jdGlvbn19IHBhcmFtc1xyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgdXBkYXRlVk1zOiBmdW5jdGlvbihwYXJhbXMpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGksIHYsIGhhc1ZNLCBhdXgsIHNvbWV0aGluZ0NoYW5nZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgbW9kZWxzID0gcGFyYW1zLm1vZGVscyxcclxuICAgICAgICAgICAgdm1zID0gcGFyYW1zLnZtcyxcclxuICAgICAgICAgICAgekluZGV4ID0gcGFyYW1zLnpJbmRleCxcclxuICAgICAgICAgICAgYWRkVG9HYW1lID0gcGFyYW1zLmFkZFRvR2FtZSxcclxuICAgICAgICAgICAgLy9jYW4gb3ZlcnJpZGUgZGVmYXVsdCBmdW5jdGlvblxyXG4gICAgICAgICAgICBtYWtlVk0gPSBwYXJhbXMubWFrZVZNIHx8IGZ1bmN0aW9uKG1vZGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdXRpbHMubWFrZVZNKG1vZGVsLCBwYXJhbXMuRGVmYXVsdENvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtcy52bUNvbnN0cnVjdG9ycyk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgaWYgKHpJbmRleCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHpJbmRleCA9IDEwMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGFkZFRvR2FtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGFkZFRvR2FtZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaGFzVk0gPSBmYWxzZTtcclxuICAgICAgICAgICAgZm9yICh2ID0gaTsgdiA8IHZtcy5sZW5ndGg7IHYrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsc1tpXSA9PT0gdm1zW3ZdLm0pIHtcclxuICAgICAgICAgICAgICAgICAgICBoYXNWTSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGhhc1ZNKSB7XHJcbiAgICAgICAgICAgICAgICAvL3B1dCB2bSBhdCBpdGVtJ3MgaW5kZXggcG9zaXRpb25cclxuICAgICAgICAgICAgICAgIGlmICh2ICE9PSBpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV4ID0gdm1zW3ZdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZtc1t2XSA9IHZtc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB2bXNbaV0gPSBhdXg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL25ldyB2bVxyXG4gICAgICAgICAgICAgICAgdm1zLnNwbGljZShpLCAwLCBtYWtlVk0obW9kZWxzW2ldKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWRkVG9HYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWUuZ2FtZS5hZGQodm1zW2ldLCB6SW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc29tZXRoaW5nQ2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9yZW1vdmUgZXh0cmEgdm1zXHJcbiAgICAgICAgZm9yICh2ID0gbW9kZWxzLmxlbmd0aDsgdiA8IHZtcy5sZW5ndGg7IHYrKykge1xyXG4gICAgICAgICAgICBpZiAoYWRkVG9HYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBtZS5nYW1lLnJlbW92ZSh2bXNbdl0sIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNvbWV0aGluZ0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2bXMuc3BsaWNlKG1vZGVscy5sZW5ndGgsIHZtcy5sZW5ndGggLSBtb2RlbHMubGVuZ3RoKTtcclxuICAgICAgICByZXR1cm4gc29tZXRoaW5nQ2hhbmdlZDtcclxuICAgIH0sXHJcbiAgICBnZXRWTTogZnVuY3Rpb24obW9kZWwsIG1vZGVsQXJyYXksIHZtQXJyYXkpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGluZGV4ID0gbW9kZWxBcnJheS5pbmRleE9mKG1vZGVsKTtcclxuICAgICAgICBpZiAoaW5kZXggIT09IG51bGwgJiYgaW5kZXggIT09IHVuZGVmaW5lZCAmJiB2bUFycmF5W2luZGV4XSAmJlxyXG4gICAgICAgICAgICAgICAgdm1BcnJheVtpbmRleF0ubSA9PT0gbW9kZWwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZtQXJyYXlbaW5kZXhdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyAnRGlkIG5vdCBmaW5kIHRoZSB2aWV3IG1vZGVsIGZvciAnICsgbW9kZWwudHlwZSArXHJcbiAgICAgICAgICAgICcgaW4gdGhlIGFycmF5LiBUcnkgY2FsbGluZyB1dGlscy51cGRhdGVWTXMgZmlyc3QuJztcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBMYXN0IG1vdXNlIHRpbGUgZ290IGJ5IHV0aWxzLmdldE1vdXNlXHJcbiAqIEB0eXBlIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fVxyXG4gKi9cclxudXRpbHMubGFzdE1vdXNlID0ge3g6IDAsIHk6IDB9O1xyXG4vKipcclxuICogTGFzdCBtb3VzZSBwaXhlbCBwb3MgZ290IGJ5IHV0aWxzLmdldE1vdXNlUHhcclxuICogQHR5cGUge3t4OiBudW1iZXIsIHk6IG51bWJlcn19XHJcbiAqL1xyXG51dGlscy5sYXN0TW91c2VQeCA9IHt4OiAwLCB5OiAwfTtcclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9zcmMvUGF0aEZpbmRpbmcnKTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdOb2RlJyAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL2NvcmUvTm9kZScpLFxuICAgICdHcmlkJyAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL2NvcmUvR3JpZCcpLFxuICAgICdIZWFwJyAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL2NvcmUvSGVhcCcpLFxuICAgICdVdGlsJyAgICAgICAgICAgICAgICAgOiByZXF1aXJlKCcuL2NvcmUvVXRpbCcpLFxuICAgICdIZXVyaXN0aWMnICAgICAgICAgICAgOiByZXF1aXJlKCcuL2NvcmUvSGV1cmlzdGljJyksXG4gICAgJ0FTdGFyRmluZGVyJyAgICAgICAgICA6IHJlcXVpcmUoJy4vZmluZGVycy9BU3RhckZpbmRlcicpLFxuICAgICdCZXN0Rmlyc3RGaW5kZXInICAgICAgOiByZXF1aXJlKCcuL2ZpbmRlcnMvQmVzdEZpcnN0RmluZGVyJyksXG4gICAgJ0JyZWFkdGhGaXJzdEZpbmRlcicgICA6IHJlcXVpcmUoJy4vZmluZGVycy9CcmVhZHRoRmlyc3RGaW5kZXInKSxcbiAgICAnRGlqa3N0cmFGaW5kZXInICAgICAgIDogcmVxdWlyZSgnLi9maW5kZXJzL0RpamtzdHJhRmluZGVyJyksXG4gICAgJ0JpQVN0YXJGaW5kZXInICAgICAgICA6IHJlcXVpcmUoJy4vZmluZGVycy9CaUFTdGFyRmluZGVyJyksXG4gICAgJ0JpQmVzdEZpcnN0RmluZGVyJyAgICA6IHJlcXVpcmUoJy4vZmluZGVycy9CaUJlc3RGaXJzdEZpbmRlcicpLFxuICAgICdCaUJyZWFkdGhGaXJzdEZpbmRlcicgOiByZXF1aXJlKCcuL2ZpbmRlcnMvQmlCcmVhZHRoRmlyc3RGaW5kZXInKSxcbiAgICAnQmlEaWprc3RyYUZpbmRlcicgICAgIDogcmVxdWlyZSgnLi9maW5kZXJzL0JpRGlqa3N0cmFGaW5kZXInKSxcbiAgICAnSnVtcFBvaW50RmluZGVyJyAgICAgIDogcmVxdWlyZSgnLi9maW5kZXJzL0p1bXBQb2ludEZpbmRlcicpXG59O1xuIiwidmFyIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKTtcblxuLyoqXG4gKiBUaGUgR3JpZCBjbGFzcywgd2hpY2ggc2VydmVzIGFzIHRoZSBlbmNhcHN1bGF0aW9uIG9mIHRoZSBsYXlvdXQgb2YgdGhlIG5vZGVzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge251bWJlcn0gd2lkdGggTnVtYmVyIG9mIGNvbHVtbnMgb2YgdGhlIGdyaWQuXG4gKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IE51bWJlciBvZiByb3dzIG9mIHRoZSBncmlkLlxuICogQHBhcmFtIHtBcnJheS48QXJyYXkuPChudW1iZXJ8Ym9vbGVhbik+Pn0gW21hdHJpeF0gLSBBIDAtMSBtYXRyaXhcbiAqICAgICByZXByZXNlbnRpbmcgdGhlIHdhbGthYmxlIHN0YXR1cyBvZiB0aGUgbm9kZXMoMCBvciBmYWxzZSBmb3Igd2Fsa2FibGUpLlxuICogICAgIElmIHRoZSBtYXRyaXggaXMgbm90IHN1cHBsaWVkLCBhbGwgdGhlIG5vZGVzIHdpbGwgYmUgd2Fsa2FibGUuICAqL1xuZnVuY3Rpb24gR3JpZCh3aWR0aCwgaGVpZ2h0LCBtYXRyaXgpIHtcbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGNvbHVtbnMgb2YgdGhlIGdyaWQuXG4gICAgICogQHR5cGUgbnVtYmVyXG4gICAgICovXG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIC8qKlxuICAgICAqIFRoZSBudW1iZXIgb2Ygcm93cyBvZiB0aGUgZ3JpZC5cbiAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIC8qKlxuICAgICAqIEEgMkQgYXJyYXkgb2Ygbm9kZXMuXG4gICAgICovXG4gICAgdGhpcy5ub2RlcyA9IHRoaXMuX2J1aWxkTm9kZXMod2lkdGgsIGhlaWdodCwgbWF0cml4KTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhbmQgcmV0dXJuIHRoZSBub2Rlcy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAqIEBwYXJhbSB7QXJyYXkuPEFycmF5LjxudW1iZXJ8Ym9vbGVhbj4+fSBbbWF0cml4XSAtIEEgMC0xIG1hdHJpeCByZXByZXNlbnRpbmdcbiAqICAgICB0aGUgd2Fsa2FibGUgc3RhdHVzIG9mIHRoZSBub2Rlcy5cbiAqIEBzZWUgR3JpZFxuICovXG5HcmlkLnByb3RvdHlwZS5fYnVpbGROb2RlcyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIG1hdHJpeCkge1xuICAgIHZhciBpLCBqLFxuICAgICAgICBub2RlcyA9IG5ldyBBcnJheShoZWlnaHQpLFxuICAgICAgICByb3c7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgaGVpZ2h0OyArK2kpIHtcbiAgICAgICAgbm9kZXNbaV0gPSBuZXcgQXJyYXkod2lkdGgpO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgd2lkdGg7ICsraikge1xuICAgICAgICAgICAgbm9kZXNbaV1bal0gPSBuZXcgTm9kZShqLCBpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgaWYgKG1hdHJpeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBub2RlcztcbiAgICB9XG5cbiAgICBpZiAobWF0cml4Lmxlbmd0aCAhPT0gaGVpZ2h0IHx8IG1hdHJpeFswXS5sZW5ndGggIT09IHdpZHRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTWF0cml4IHNpemUgZG9lcyBub3QgZml0Jyk7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGhlaWdodDsgKytpKSB7XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCB3aWR0aDsgKytqKSB7XG4gICAgICAgICAgICBpZiAobWF0cml4W2ldW2pdKSB7XG4gICAgICAgICAgICAgICAgLy8gMCwgZmFsc2UsIG51bGwgd2lsbCBiZSB3YWxrYWJsZVxuICAgICAgICAgICAgICAgIC8vIHdoaWxlIG90aGVycyB3aWxsIGJlIHVuLXdhbGthYmxlXG4gICAgICAgICAgICAgICAgbm9kZXNbaV1bal0ud2Fsa2FibGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub2Rlcztcbn07XG5cblxuR3JpZC5wcm90b3R5cGUuZ2V0Tm9kZUF0ID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiB0aGlzLm5vZGVzW3ldW3hdO1xufTtcblxuXG4vKipcbiAqIERldGVybWluZSB3aGV0aGVyIHRoZSBub2RlIGF0IHRoZSBnaXZlbiBwb3NpdGlvbiBpcyB3YWxrYWJsZS5cbiAqIChBbHNvIHJldHVybnMgZmFsc2UgaWYgdGhlIHBvc2l0aW9uIGlzIG91dHNpZGUgdGhlIGdyaWQuKVxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSBub2RlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gLSBUaGUgd2Fsa2FiaWxpdHkgb2YgdGhlIG5vZGUuXG4gKi9cbkdyaWQucHJvdG90eXBlLmlzV2Fsa2FibGVBdCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICByZXR1cm4gdGhpcy5pc0luc2lkZSh4LCB5KSAmJiB0aGlzLm5vZGVzW3ldW3hdLndhbGthYmxlO1xufTtcblxuXG4vKipcbiAqIERldGVybWluZSB3aGV0aGVyIHRoZSBwb3NpdGlvbiBpcyBpbnNpZGUgdGhlIGdyaWQuXG4gKiBYWFg6IGBncmlkLmlzSW5zaWRlKHgsIHkpYCBpcyB3aWVyZCB0byByZWFkLlxuICogSXQgc2hvdWxkIGJlIGAoeCwgeSkgaXMgaW5zaWRlIGdyaWRgLCBidXQgSSBmYWlsZWQgdG8gZmluZCBhIGJldHRlclxuICogbmFtZSBmb3IgdGhpcyBtZXRob2QuXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbkdyaWQucHJvdG90eXBlLmlzSW5zaWRlID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHJldHVybiAoeCA+PSAwICYmIHggPCB0aGlzLndpZHRoKSAmJiAoeSA+PSAwICYmIHkgPCB0aGlzLmhlaWdodCk7XG59O1xuXG5cbi8qKlxuICogU2V0IHdoZXRoZXIgdGhlIG5vZGUgb24gdGhlIGdpdmVuIHBvc2l0aW9uIGlzIHdhbGthYmxlLlxuICogTk9URTogdGhyb3dzIGV4Y2VwdGlvbiBpZiB0aGUgY29vcmRpbmF0ZSBpcyBub3QgaW5zaWRlIHRoZSBncmlkLlxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSBub2RlLlxuICogQHBhcmFtIHtib29sZWFufSB3YWxrYWJsZSAtIFdoZXRoZXIgdGhlIHBvc2l0aW9uIGlzIHdhbGthYmxlLlxuICovXG5HcmlkLnByb3RvdHlwZS5zZXRXYWxrYWJsZUF0ID0gZnVuY3Rpb24oeCwgeSwgd2Fsa2FibGUpIHtcbiAgICB0aGlzLm5vZGVzW3ldW3hdLndhbGthYmxlID0gd2Fsa2FibGU7XG59O1xuXG5cbi8qKlxuICogR2V0IHRoZSBuZWlnaGJvcnMgb2YgdGhlIGdpdmVuIG5vZGUuXG4gKlxuICogICAgIG9mZnNldHMgICAgICBkaWFnb25hbE9mZnNldHM6XG4gKiAgKy0tLSstLS0rLS0tKyAgICArLS0tKy0tLSstLS0rXG4gKiAgfCAgIHwgMCB8ICAgfCAgICB8IDAgfCAgIHwgMSB8XG4gKiAgKy0tLSstLS0rLS0tKyAgICArLS0tKy0tLSstLS0rXG4gKiAgfCAzIHwgICB8IDEgfCAgICB8ICAgfCAgIHwgICB8XG4gKiAgKy0tLSstLS0rLS0tKyAgICArLS0tKy0tLSstLS0rXG4gKiAgfCAgIHwgMiB8ICAgfCAgICB8IDMgfCAgIHwgMiB8XG4gKiAgKy0tLSstLS0rLS0tKyAgICArLS0tKy0tLSstLS0rXG4gKlxuICogIFdoZW4gYWxsb3dEaWFnb25hbCBpcyB0cnVlLCBpZiBvZmZzZXRzW2ldIGlzIHZhbGlkLCB0aGVuXG4gKiAgZGlhZ29uYWxPZmZzZXRzW2ldIGFuZFxuICogIGRpYWdvbmFsT2Zmc2V0c1soaSArIDEpICUgNF0gaXMgdmFsaWQuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYWxsb3dEaWFnb25hbFxuICogQHBhcmFtIHtib29sZWFufSBkb250Q3Jvc3NDb3JuZXJzXG4gKi9cbkdyaWQucHJvdG90eXBlLmdldE5laWdoYm9ycyA9IGZ1bmN0aW9uKG5vZGUsIGFsbG93RGlhZ29uYWwsIGRvbnRDcm9zc0Nvcm5lcnMpIHtcbiAgICB2YXIgeCA9IG5vZGUueCxcbiAgICAgICAgeSA9IG5vZGUueSxcbiAgICAgICAgbmVpZ2hib3JzID0gW10sXG4gICAgICAgIHMwID0gZmFsc2UsIGQwID0gZmFsc2UsXG4gICAgICAgIHMxID0gZmFsc2UsIGQxID0gZmFsc2UsXG4gICAgICAgIHMyID0gZmFsc2UsIGQyID0gZmFsc2UsXG4gICAgICAgIHMzID0gZmFsc2UsIGQzID0gZmFsc2UsXG4gICAgICAgIG5vZGVzID0gdGhpcy5ub2RlcztcblxuICAgIC8vIOKGkVxuICAgIGlmICh0aGlzLmlzV2Fsa2FibGVBdCh4LCB5IC0gMSkpIHtcbiAgICAgICAgbmVpZ2hib3JzLnB1c2gobm9kZXNbeSAtIDFdW3hdKTtcbiAgICAgICAgczAgPSB0cnVlO1xuICAgIH1cbiAgICAvLyDihpJcbiAgICBpZiAodGhpcy5pc1dhbGthYmxlQXQoeCArIDEsIHkpKSB7XG4gICAgICAgIG5laWdoYm9ycy5wdXNoKG5vZGVzW3ldW3ggKyAxXSk7XG4gICAgICAgIHMxID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8g4oaTXG4gICAgaWYgKHRoaXMuaXNXYWxrYWJsZUF0KHgsIHkgKyAxKSkge1xuICAgICAgICBuZWlnaGJvcnMucHVzaChub2Rlc1t5ICsgMV1beF0pO1xuICAgICAgICBzMiA9IHRydWU7XG4gICAgfVxuICAgIC8vIOKGkFxuICAgIGlmICh0aGlzLmlzV2Fsa2FibGVBdCh4IC0gMSwgeSkpIHtcbiAgICAgICAgbmVpZ2hib3JzLnB1c2gobm9kZXNbeV1beCAtIDFdKTtcbiAgICAgICAgczMgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghYWxsb3dEaWFnb25hbCkge1xuICAgICAgICByZXR1cm4gbmVpZ2hib3JzO1xuICAgIH1cblxuICAgIGlmIChkb250Q3Jvc3NDb3JuZXJzKSB7XG4gICAgICAgIGQwID0gczMgJiYgczA7XG4gICAgICAgIGQxID0gczAgJiYgczE7XG4gICAgICAgIGQyID0gczEgJiYgczI7XG4gICAgICAgIGQzID0gczIgJiYgczM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZDAgPSBzMyB8fCBzMDtcbiAgICAgICAgZDEgPSBzMCB8fCBzMTtcbiAgICAgICAgZDIgPSBzMSB8fCBzMjtcbiAgICAgICAgZDMgPSBzMiB8fCBzMztcbiAgICB9XG5cbiAgICAvLyDihpZcbiAgICBpZiAoZDAgJiYgdGhpcy5pc1dhbGthYmxlQXQoeCAtIDEsIHkgLSAxKSkge1xuICAgICAgICBuZWlnaGJvcnMucHVzaChub2Rlc1t5IC0gMV1beCAtIDFdKTtcbiAgICB9XG4gICAgLy8g4oaXXG4gICAgaWYgKGQxICYmIHRoaXMuaXNXYWxrYWJsZUF0KHggKyAxLCB5IC0gMSkpIHtcbiAgICAgICAgbmVpZ2hib3JzLnB1c2gobm9kZXNbeSAtIDFdW3ggKyAxXSk7XG4gICAgfVxuICAgIC8vIOKGmFxuICAgIGlmIChkMiAmJiB0aGlzLmlzV2Fsa2FibGVBdCh4ICsgMSwgeSArIDEpKSB7XG4gICAgICAgIG5laWdoYm9ycy5wdXNoKG5vZGVzW3kgKyAxXVt4ICsgMV0pO1xuICAgIH1cbiAgICAvLyDihplcbiAgICBpZiAoZDMgJiYgdGhpcy5pc1dhbGthYmxlQXQoeCAtIDEsIHkgKyAxKSkge1xuICAgICAgICBuZWlnaGJvcnMucHVzaChub2Rlc1t5ICsgMV1beCAtIDFdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmVpZ2hib3JzO1xufTtcblxuXG4vKipcbiAqIEdldCBhIGNsb25lIG9mIHRoaXMgZ3JpZC5cbiAqIEByZXR1cm4ge0dyaWR9IENsb25lZCBncmlkLlxuICovXG5HcmlkLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpLCBqLFxuXG4gICAgICAgIHdpZHRoID0gdGhpcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0ID0gdGhpcy5oZWlnaHQsXG4gICAgICAgIHRoaXNOb2RlcyA9IHRoaXMubm9kZXMsXG5cbiAgICAgICAgbmV3R3JpZCA9IG5ldyBHcmlkKHdpZHRoLCBoZWlnaHQpLFxuICAgICAgICBuZXdOb2RlcyA9IG5ldyBBcnJheShoZWlnaHQpLFxuICAgICAgICByb3c7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgaGVpZ2h0OyArK2kpIHtcbiAgICAgICAgbmV3Tm9kZXNbaV0gPSBuZXcgQXJyYXkod2lkdGgpO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgd2lkdGg7ICsraikge1xuICAgICAgICAgICAgbmV3Tm9kZXNbaV1bal0gPSBuZXcgTm9kZShqLCBpLCB0aGlzTm9kZXNbaV1bal0ud2Fsa2FibGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV3R3JpZC5ub2RlcyA9IG5ld05vZGVzO1xuXG4gICAgcmV0dXJuIG5ld0dyaWQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyaWQ7XG4iLCIvLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9xaWFvL2hlYXAuanNcbi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS4zLjFcbihmdW5jdGlvbigpIHtcbiAgdmFyIEhlYXAsIGRlZmF1bHRDbXAsIGZsb29yLCBoZWFwaWZ5LCBoZWFwcG9wLCBoZWFwcHVzaCwgaGVhcHB1c2hwb3AsIGhlYXByZXBsYWNlLCBpbnNvcnQsIG1pbiwgbmxhcmdlc3QsIG5zbWFsbGVzdCwgdXBkYXRlSXRlbSwgX3NpZnRkb3duLCBfc2lmdHVwO1xuXG4gIGZsb29yID0gTWF0aC5mbG9vciwgbWluID0gTWF0aC5taW47XG5cbiAgLyogXG4gIERlZmF1bHQgY29tcGFyaXNvbiBmdW5jdGlvbiB0byBiZSB1c2VkXG4gICovXG5cblxuICBkZWZhdWx0Q21wID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmICh4IDwgeSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBpZiAoeCA+IHkpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfTtcblxuICAvKiBcbiAgSW5zZXJ0IGl0ZW0geCBpbiBsaXN0IGEsIGFuZCBrZWVwIGl0IHNvcnRlZCBhc3N1bWluZyBhIGlzIHNvcnRlZC5cbiAgXG4gIElmIHggaXMgYWxyZWFkeSBpbiBhLCBpbnNlcnQgaXQgdG8gdGhlIHJpZ2h0IG9mIHRoZSByaWdodG1vc3QgeC5cbiAgXG4gIE9wdGlvbmFsIGFyZ3MgbG8gKGRlZmF1bHQgMCkgYW5kIGhpIChkZWZhdWx0IGEubGVuZ3RoKSBib3VuZCB0aGUgc2xpY2VcbiAgb2YgYSB0byBiZSBzZWFyY2hlZC5cbiAgKi9cblxuXG4gIGluc29ydCA9IGZ1bmN0aW9uKGEsIHgsIGxvLCBoaSwgY21wKSB7XG4gICAgdmFyIG1pZDtcbiAgICBpZiAobG8gPT0gbnVsbCkge1xuICAgICAgbG8gPSAwO1xuICAgIH1cbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGlmIChsbyA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbG8gbXVzdCBiZSBub24tbmVnYXRpdmUnKTtcbiAgICB9XG4gICAgaWYgKGhpID09IG51bGwpIHtcbiAgICAgIGhpID0gYS5sZW5ndGg7XG4gICAgfVxuICAgIHdoaWxlIChjbXAobG8sIGhpKSA8IDApIHtcbiAgICAgIG1pZCA9IGZsb29yKChsbyArIGhpKSAvIDIpO1xuICAgICAgaWYgKGNtcCh4LCBhW21pZF0pIDwgMCkge1xuICAgICAgICBoaSA9IG1pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvID0gbWlkICsgMTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIChbXS5zcGxpY2UuYXBwbHkoYSwgW2xvLCBsbyAtIGxvXS5jb25jYXQoeCkpLCB4KTtcbiAgfTtcblxuICAvKlxuICBQdXNoIGl0ZW0gb250byBoZWFwLCBtYWludGFpbmluZyB0aGUgaGVhcCBpbnZhcmlhbnQuXG4gICovXG5cblxuICBoZWFwcHVzaCA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBjbXApIHtcbiAgICBpZiAoY21wID09IG51bGwpIHtcbiAgICAgIGNtcCA9IGRlZmF1bHRDbXA7XG4gICAgfVxuICAgIGFycmF5LnB1c2goaXRlbSk7XG4gICAgcmV0dXJuIF9zaWZ0ZG93bihhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gMSwgY21wKTtcbiAgfTtcblxuICAvKlxuICBQb3AgdGhlIHNtYWxsZXN0IGl0ZW0gb2ZmIHRoZSBoZWFwLCBtYWludGFpbmluZyB0aGUgaGVhcCBpbnZhcmlhbnQuXG4gICovXG5cblxuICBoZWFwcG9wID0gZnVuY3Rpb24oYXJyYXksIGNtcCkge1xuICAgIHZhciBsYXN0ZWx0LCByZXR1cm5pdGVtO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgbGFzdGVsdCA9IGFycmF5LnBvcCgpO1xuICAgIGlmIChhcnJheS5sZW5ndGgpIHtcbiAgICAgIHJldHVybml0ZW0gPSBhcnJheVswXTtcbiAgICAgIGFycmF5WzBdID0gbGFzdGVsdDtcbiAgICAgIF9zaWZ0dXAoYXJyYXksIDAsIGNtcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybml0ZW0gPSBsYXN0ZWx0O1xuICAgIH1cbiAgICByZXR1cm4gcmV0dXJuaXRlbTtcbiAgfTtcblxuICAvKlxuICBQb3AgYW5kIHJldHVybiB0aGUgY3VycmVudCBzbWFsbGVzdCB2YWx1ZSwgYW5kIGFkZCB0aGUgbmV3IGl0ZW0uXG4gIFxuICBUaGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gaGVhcHBvcCgpIGZvbGxvd2VkIGJ5IGhlYXBwdXNoKCksIGFuZCBjYW4gYmUgXG4gIG1vcmUgYXBwcm9wcmlhdGUgd2hlbiB1c2luZyBhIGZpeGVkIHNpemUgaGVhcC4gTm90ZSB0aGF0IHRoZSB2YWx1ZVxuICByZXR1cm5lZCBtYXkgYmUgbGFyZ2VyIHRoYW4gaXRlbSEgVGhhdCBjb25zdHJhaW5zIHJlYXNvbmFibGUgdXNlIG9mXG4gIHRoaXMgcm91dGluZSB1bmxlc3Mgd3JpdHRlbiBhcyBwYXJ0IG9mIGEgY29uZGl0aW9uYWwgcmVwbGFjZW1lbnQ6XG4gICAgICBpZiBpdGVtID4gYXJyYXlbMF1cbiAgICAgICAgaXRlbSA9IGhlYXByZXBsYWNlKGFycmF5LCBpdGVtKVxuICAqL1xuXG5cbiAgaGVhcHJlcGxhY2UgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgY21wKSB7XG4gICAgdmFyIHJldHVybml0ZW07XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICByZXR1cm5pdGVtID0gYXJyYXlbMF07XG4gICAgYXJyYXlbMF0gPSBpdGVtO1xuICAgIF9zaWZ0dXAoYXJyYXksIDAsIGNtcCk7XG4gICAgcmV0dXJuIHJldHVybml0ZW07XG4gIH07XG5cbiAgLypcbiAgRmFzdCB2ZXJzaW9uIG9mIGEgaGVhcHB1c2ggZm9sbG93ZWQgYnkgYSBoZWFwcG9wLlxuICAqL1xuXG5cbiAgaGVhcHB1c2hwb3AgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgY21wKSB7XG4gICAgdmFyIF9yZWY7XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBpZiAoYXJyYXkubGVuZ3RoICYmIGNtcChhcnJheVswXSwgaXRlbSkgPCAwKSB7XG4gICAgICBfcmVmID0gW2FycmF5WzBdLCBpdGVtXSwgaXRlbSA9IF9yZWZbMF0sIGFycmF5WzBdID0gX3JlZlsxXTtcbiAgICAgIF9zaWZ0dXAoYXJyYXksIDAsIGNtcCk7XG4gICAgfVxuICAgIHJldHVybiBpdGVtO1xuICB9O1xuXG4gIC8qXG4gIFRyYW5zZm9ybSBsaXN0IGludG8gYSBoZWFwLCBpbi1wbGFjZSwgaW4gTyhhcnJheS5sZW5ndGgpIHRpbWUuXG4gICovXG5cblxuICBoZWFwaWZ5ID0gZnVuY3Rpb24oYXJyYXksIGNtcCkge1xuICAgIHZhciBpLCBfaSwgX2osIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVzdWx0cywgX3Jlc3VsdHMxO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgX3JlZjEgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBfcmVzdWx0czEgPSBbXTtcbiAgICAgIGZvciAodmFyIF9qID0gMCwgX3JlZiA9IGZsb29yKGFycmF5Lmxlbmd0aCAvIDIpOyAwIDw9IF9yZWYgPyBfaiA8IF9yZWYgOiBfaiA+IF9yZWY7IDAgPD0gX3JlZiA/IF9qKysgOiBfai0tKXsgX3Jlc3VsdHMxLnB1c2goX2opOyB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHMxO1xuICAgIH0pLmFwcGx5KHRoaXMpLnJldmVyc2UoKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjEubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGkgPSBfcmVmMVtfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKF9zaWZ0dXAoYXJyYXksIGksIGNtcCkpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgLypcbiAgVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgZ2l2ZW4gaXRlbSBpbiB0aGUgaGVhcC5cbiAgVGhpcyBmdW5jdGlvbiBzaG91bGQgYmUgY2FsbGVkIGV2ZXJ5IHRpbWUgdGhlIGl0ZW0gaXMgYmVpbmcgbW9kaWZpZWQuXG4gICovXG5cblxuICB1cGRhdGVJdGVtID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGNtcCkge1xuICAgIHZhciBwb3M7XG4gICAgaWYgKGNtcCA9PSBudWxsKSB7XG4gICAgICBjbXAgPSBkZWZhdWx0Q21wO1xuICAgIH1cbiAgICBwb3MgPSBhcnJheS5pbmRleE9mKGl0ZW0pO1xuICAgIF9zaWZ0ZG93bihhcnJheSwgMCwgcG9zLCBjbXApO1xuICAgIHJldHVybiBfc2lmdHVwKGFycmF5LCBwb3MsIGNtcCk7XG4gIH07XG5cbiAgLypcbiAgRmluZCB0aGUgbiBsYXJnZXN0IGVsZW1lbnRzIGluIGEgZGF0YXNldC5cbiAgKi9cblxuXG4gIG5sYXJnZXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGNtcCkge1xuICAgIHZhciBlbGVtLCByZXN1bHQsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgcmVzdWx0ID0gYXJyYXkuc2xpY2UoMCwgbik7XG4gICAgaWYgKCFyZXN1bHQubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBoZWFwaWZ5KHJlc3VsdCwgY21wKTtcbiAgICBfcmVmID0gYXJyYXkuc2xpY2Uobik7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBlbGVtID0gX3JlZltfaV07XG4gICAgICBoZWFwcHVzaHBvcChyZXN1bHQsIGVsZW0sIGNtcCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQuc29ydChjbXApLnJldmVyc2UoKTtcbiAgfTtcblxuICAvKlxuICBGaW5kIHRoZSBuIHNtYWxsZXN0IGVsZW1lbnRzIGluIGEgZGF0YXNldC5cbiAgKi9cblxuXG4gIG5zbWFsbGVzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBjbXApIHtcbiAgICB2YXIgZWxlbSwgaSwgbG9zLCByZXN1bHQsIF9pLCBfaiwgX2xlbiwgX3JlZiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgaWYgKG4gKiAxMCA8PSBhcnJheS5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdCA9IGFycmF5LnNsaWNlKDAsIG4pLnNvcnQoY21wKTtcbiAgICAgIGlmICghcmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbG9zID0gcmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXTtcbiAgICAgIF9yZWYgPSBhcnJheS5zbGljZShuKTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBlbGVtID0gX3JlZltfaV07XG4gICAgICAgIGlmIChjbXAoZWxlbSwgbG9zKSA8IDApIHtcbiAgICAgICAgICBpbnNvcnQocmVzdWx0LCBlbGVtLCAwLCBudWxsLCBjbXApO1xuICAgICAgICAgIHJlc3VsdC5wb3AoKTtcbiAgICAgICAgICBsb3MgPSByZXN1bHRbcmVzdWx0Lmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBoZWFwaWZ5KGFycmF5LCBjbXApO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gX2ogPSAwLCBfcmVmMSA9IG1pbihuLCBhcnJheS5sZW5ndGgpOyAwIDw9IF9yZWYxID8gX2ogPCBfcmVmMSA6IF9qID4gX3JlZjE7IGkgPSAwIDw9IF9yZWYxID8gKytfaiA6IC0tX2opIHtcbiAgICAgIF9yZXN1bHRzLnB1c2goaGVhcHBvcChhcnJheSwgY21wKSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBfc2lmdGRvd24gPSBmdW5jdGlvbihhcnJheSwgc3RhcnRwb3MsIHBvcywgY21wKSB7XG4gICAgdmFyIG5ld2l0ZW0sIHBhcmVudCwgcGFyZW50cG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgbmV3aXRlbSA9IGFycmF5W3Bvc107XG4gICAgd2hpbGUgKHBvcyA+IHN0YXJ0cG9zKSB7XG4gICAgICBwYXJlbnRwb3MgPSAocG9zIC0gMSkgPj4gMTtcbiAgICAgIHBhcmVudCA9IGFycmF5W3BhcmVudHBvc107XG4gICAgICBpZiAoY21wKG5ld2l0ZW0sIHBhcmVudCkgPCAwKSB7XG4gICAgICAgIGFycmF5W3Bvc10gPSBwYXJlbnQ7XG4gICAgICAgIHBvcyA9IHBhcmVudHBvcztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5W3Bvc10gPSBuZXdpdGVtO1xuICB9O1xuXG4gIF9zaWZ0dXAgPSBmdW5jdGlvbihhcnJheSwgcG9zLCBjbXApIHtcbiAgICB2YXIgY2hpbGRwb3MsIGVuZHBvcywgbmV3aXRlbSwgcmlnaHRwb3MsIHN0YXJ0cG9zO1xuICAgIGlmIChjbXAgPT0gbnVsbCkge1xuICAgICAgY21wID0gZGVmYXVsdENtcDtcbiAgICB9XG4gICAgZW5kcG9zID0gYXJyYXkubGVuZ3RoO1xuICAgIHN0YXJ0cG9zID0gcG9zO1xuICAgIG5ld2l0ZW0gPSBhcnJheVtwb3NdO1xuICAgIGNoaWxkcG9zID0gMiAqIHBvcyArIDE7XG4gICAgd2hpbGUgKGNoaWxkcG9zIDwgZW5kcG9zKSB7XG4gICAgICByaWdodHBvcyA9IGNoaWxkcG9zICsgMTtcbiAgICAgIGlmIChyaWdodHBvcyA8IGVuZHBvcyAmJiAhKGNtcChhcnJheVtjaGlsZHBvc10sIGFycmF5W3JpZ2h0cG9zXSkgPCAwKSkge1xuICAgICAgICBjaGlsZHBvcyA9IHJpZ2h0cG9zO1xuICAgICAgfVxuICAgICAgYXJyYXlbcG9zXSA9IGFycmF5W2NoaWxkcG9zXTtcbiAgICAgIHBvcyA9IGNoaWxkcG9zO1xuICAgICAgY2hpbGRwb3MgPSAyICogcG9zICsgMTtcbiAgICB9XG4gICAgYXJyYXlbcG9zXSA9IG5ld2l0ZW07XG4gICAgcmV0dXJuIF9zaWZ0ZG93bihhcnJheSwgc3RhcnRwb3MsIHBvcywgY21wKTtcbiAgfTtcblxuICBIZWFwID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgSGVhcC5uYW1lID0gJ0hlYXAnO1xuXG4gICAgSGVhcC5wdXNoID0gaGVhcHB1c2g7XG5cbiAgICBIZWFwLnBvcCA9IGhlYXBwb3A7XG5cbiAgICBIZWFwLnJlcGxhY2UgPSBoZWFwcmVwbGFjZTtcblxuICAgIEhlYXAucHVzaHBvcCA9IGhlYXBwdXNocG9wO1xuXG4gICAgSGVhcC5oZWFwaWZ5ID0gaGVhcGlmeTtcblxuICAgIEhlYXAubmxhcmdlc3QgPSBubGFyZ2VzdDtcblxuICAgIEhlYXAubnNtYWxsZXN0ID0gbnNtYWxsZXN0O1xuXG4gICAgZnVuY3Rpb24gSGVhcChjbXApIHtcbiAgICAgIHRoaXMuY21wID0gY21wICE9IG51bGwgPyBjbXAgOiBkZWZhdWx0Q21wO1xuICAgICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIH1cblxuICAgIEhlYXAucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaGVhcHB1c2godGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBoZWFwcG9wKHRoaXMubm9kZXMsIHRoaXMuY21wKTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXNbMF07XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMuaW5kZXhPZih4KSAhPT0gLTE7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gaGVhcHJlcGxhY2UodGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5wdXNocG9wID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIGhlYXBwdXNocG9wKHRoaXMubm9kZXMsIHgsIHRoaXMuY21wKTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuaGVhcGlmeSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGhlYXBpZnkodGhpcy5ub2RlcywgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS51cGRhdGVJdGVtID0gZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHVwZGF0ZUl0ZW0odGhpcy5ub2RlcywgeCwgdGhpcy5jbXApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMgPSBbXTtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm5vZGVzLmxlbmd0aCA9PT0gMDtcbiAgICB9O1xuXG4gICAgSGVhcC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMubm9kZXMubGVuZ3RoO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGhlYXA7XG4gICAgICBoZWFwID0gbmV3IEhlYXAoKTtcbiAgICAgIGhlYXAubm9kZXMgPSB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgICAgcmV0dXJuIGhlYXA7XG4gICAgfTtcblxuICAgIEhlYXAucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLm5vZGVzLnNsaWNlKDApO1xuICAgIH07XG5cbiAgICBIZWFwLnByb3RvdHlwZS5pbnNlcnQgPSBIZWFwLnByb3RvdHlwZS5wdXNoO1xuXG4gICAgSGVhcC5wcm90b3R5cGUucmVtb3ZlID0gSGVhcC5wcm90b3R5cGUucG9wO1xuXG4gICAgSGVhcC5wcm90b3R5cGUudG9wID0gSGVhcC5wcm90b3R5cGUucGVlaztcblxuICAgIEhlYXAucHJvdG90eXBlLmZyb250ID0gSGVhcC5wcm90b3R5cGUucGVlaztcblxuICAgIEhlYXAucHJvdG90eXBlLmhhcyA9IEhlYXAucHJvdG90eXBlLmNvbnRhaW5zO1xuXG4gICAgSGVhcC5wcm90b3R5cGUuY29weSA9IEhlYXAucHJvdG90eXBlLmNsb25lO1xuXG4gICAgcmV0dXJuIEhlYXA7XG5cbiAgfSkoKTtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgPyBtb2R1bGUuZXhwb3J0cyA6IHZvaWQgMCkge1xuICAgIG1vZHVsZS5leHBvcnRzID0gSGVhcDtcbiAgfSBlbHNlIHtcbiAgICB3aW5kb3cuSGVhcCA9IEhlYXA7XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcbiIsIi8qKlxuICogQG5hbWVzcGFjZSBQRi5IZXVyaXN0aWNcbiAqIEBkZXNjcmlwdGlvbiBBIGNvbGxlY3Rpb24gb2YgaGV1cmlzdGljIGZ1bmN0aW9ucy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgLyoqXG4gICAqIE1hbmhhdHRhbiBkaXN0YW5jZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGR4IC0gRGlmZmVyZW5jZSBpbiB4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gZHkgLSBEaWZmZXJlbmNlIGluIHkuXG4gICAqIEByZXR1cm4ge251bWJlcn0gZHggKyBkeVxuICAgKi9cbiAgbWFuaGF0dGFuOiBmdW5jdGlvbihkeCwgZHkpIHtcbiAgICAgIHJldHVybiBkeCArIGR5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBFdWNsaWRlYW4gZGlzdGFuY2UuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkeCAtIERpZmZlcmVuY2UgaW4geC5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGR5IC0gRGlmZmVyZW5jZSBpbiB5LlxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHNxcnQoZHggKiBkeCArIGR5ICogZHkpXG4gICAqL1xuICBldWNsaWRlYW46IGZ1bmN0aW9uKGR4LCBkeSkge1xuICAgICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWJ5c2hldiBkaXN0YW5jZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGR4IC0gRGlmZmVyZW5jZSBpbiB4LlxuICAgKiBAcGFyYW0ge251bWJlcn0gZHkgLSBEaWZmZXJlbmNlIGluIHkuXG4gICAqIEByZXR1cm4ge251bWJlcn0gbWF4KGR4LCBkeSlcbiAgICovXG4gIGNoZWJ5c2hldjogZnVuY3Rpb24oZHgsIGR5KSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXgoZHgsIGR5KTtcbiAgfVxuXG59O1xuIiwiLyoqXG4gKiBBIG5vZGUgaW4gZ3JpZC4gXG4gKiBUaGlzIGNsYXNzIGhvbGRzIHNvbWUgYmFzaWMgaW5mb3JtYXRpb24gYWJvdXQgYSBub2RlIGFuZCBjdXN0b20gXG4gKiBhdHRyaWJ1dGVzIG1heSBiZSBhZGRlZCwgZGVwZW5kaW5nIG9uIHRoZSBhbGdvcml0aG1zJyBuZWVkcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBub2RlIG9uIHRoZSBncmlkLlxuICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeSBjb29yZGluYXRlIG9mIHRoZSBub2RlIG9uIHRoZSBncmlkLlxuICogQHBhcmFtIHtib29sZWFufSBbd2Fsa2FibGVdIC0gV2hldGhlciB0aGlzIG5vZGUgaXMgd2Fsa2FibGUuXG4gKi9cbmZ1bmN0aW9uIE5vZGUoeCwgeSwgd2Fsa2FibGUpIHtcbiAgICAvKipcbiAgICAgKiBUaGUgeCBjb29yZGluYXRlIG9mIHRoZSBub2RlIG9uIHRoZSBncmlkLlxuICAgICAqIEB0eXBlIG51bWJlclxuICAgICAqL1xuICAgIHRoaXMueCA9IHg7XG4gICAgLyoqXG4gICAgICogVGhlIHkgY29vcmRpbmF0ZSBvZiB0aGUgbm9kZSBvbiB0aGUgZ3JpZC5cbiAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnkgPSB5O1xuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhpcyBub2RlIGNhbiBiZSB3YWxrZWQgdGhyb3VnaC5cbiAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICovXG4gICAgdGhpcy53YWxrYWJsZSA9ICh3YWxrYWJsZSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHdhbGthYmxlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTm9kZTtcbiIsIi8qKlxuICogQmFja3RyYWNlIGFjY29yZGluZyB0byB0aGUgcGFyZW50IHJlY29yZHMgYW5kIHJldHVybiB0aGUgcGF0aC5cbiAqIChpbmNsdWRpbmcgYm90aCBzdGFydCBhbmQgZW5kIG5vZGVzKVxuICogQHBhcmFtIHtOb2RlfSBub2RlIEVuZCBub2RlXG4gKiBAcmV0dXJuIHtBcnJheS48QXJyYXkuPG51bWJlcj4+fSB0aGUgcGF0aFxuICovXG5mdW5jdGlvbiBiYWNrdHJhY2Uobm9kZSkge1xuICAgIHZhciBwYXRoID0gW1tub2RlLngsIG5vZGUueV1dO1xuICAgIHdoaWxlIChub2RlLnBhcmVudCkge1xuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gICAgICAgIHBhdGgucHVzaChbbm9kZS54LCBub2RlLnldKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGgucmV2ZXJzZSgpO1xufVxuZXhwb3J0cy5iYWNrdHJhY2UgPSBiYWNrdHJhY2U7XG5cbi8qKlxuICogQmFja3RyYWNlIGZyb20gc3RhcnQgYW5kIGVuZCBub2RlLCBhbmQgcmV0dXJuIHRoZSBwYXRoLlxuICogKGluY2x1ZGluZyBib3RoIHN0YXJ0IGFuZCBlbmQgbm9kZXMpXG4gKiBAcGFyYW0ge05vZGV9XG4gKiBAcGFyYW0ge05vZGV9XG4gKi9cbmZ1bmN0aW9uIGJpQmFja3RyYWNlKG5vZGVBLCBub2RlQikge1xuICAgIHZhciBwYXRoQSA9IGJhY2t0cmFjZShub2RlQSksXG4gICAgICAgIHBhdGhCID0gYmFja3RyYWNlKG5vZGVCKTtcbiAgICByZXR1cm4gcGF0aEEuY29uY2F0KHBhdGhCLnJldmVyc2UoKSk7XG59XG5leHBvcnRzLmJpQmFja3RyYWNlID0gYmlCYWNrdHJhY2U7XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgbGVuZ3RoIG9mIHRoZSBwYXRoLlxuICogQHBhcmFtIHtBcnJheS48QXJyYXkuPG51bWJlcj4+fSBwYXRoIFRoZSBwYXRoXG4gKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBsZW5ndGggb2YgdGhlIHBhdGhcbiAqL1xuZnVuY3Rpb24gcGF0aExlbmd0aChwYXRoKSB7XG4gICAgdmFyIGksIHN1bSA9IDAsIGEsIGIsIGR4LCBkeTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgcGF0aC5sZW5ndGg7ICsraSkge1xuICAgICAgICBhID0gcGF0aFtpIC0gMV07XG4gICAgICAgIGIgPSBwYXRoW2ldO1xuICAgICAgICBkeCA9IGFbMF0gLSBiWzBdO1xuICAgICAgICBkeSA9IGFbMV0gLSBiWzFdO1xuICAgICAgICBzdW0gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICB9XG4gICAgcmV0dXJuIHN1bTtcbn1cbmV4cG9ydHMucGF0aExlbmd0aCA9IHBhdGhMZW5ndGg7XG5cblxuLyoqXG4gKiBHaXZlbiB0aGUgc3RhcnQgYW5kIGVuZCBjb29yZGluYXRlcywgcmV0dXJuIGFsbCB0aGUgY29vcmRpbmF0ZXMgbHlpbmdcbiAqIG9uIHRoZSBsaW5lIGZvcm1lZCBieSB0aGVzZSBjb29yZGluYXRlcywgYmFzZWQgb24gQnJlc2VuaGFtJ3MgYWxnb3JpdGhtLlxuICogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CcmVzZW5oYW0nc19saW5lX2FsZ29yaXRobSNTaW1wbGlmaWNhdGlvblxuICogQHBhcmFtIHtudW1iZXJ9IHgwIFN0YXJ0IHggY29vcmRpbmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHkwIFN0YXJ0IHkgY29vcmRpbmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHgxIEVuZCB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB5MSBFbmQgeSBjb29yZGluYXRlXG4gKiBAcmV0dXJuIHtBcnJheS48QXJyYXkuPG51bWJlcj4+fSBUaGUgY29vcmRpbmF0ZXMgb24gdGhlIGxpbmVcbiAqL1xuZnVuY3Rpb24gZ2V0TGluZSh4MCwgeTAsIHgxLCB5MSkge1xuICAgIHZhciBhYnMgPSBNYXRoLmFicyxcbiAgICAgICAgbGluZSA9IFtdLFxuICAgICAgICBzeCwgc3ksIGR4LCBkeSwgZXJyLCBlMjtcblxuICAgIGR4ID0gYWJzKHgxIC0geDApO1xuICAgIGR5ID0gYWJzKHkxIC0geTApO1xuXG4gICAgc3ggPSAoeDAgPCB4MSkgPyAxIDogLTE7XG4gICAgc3kgPSAoeTAgPCB5MSkgPyAxIDogLTE7XG5cbiAgICBlcnIgPSBkeCAtIGR5O1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgbGluZS5wdXNoKFt4MCwgeTBdKTtcblxuICAgICAgICBpZiAoeDAgPT09IHgxICYmIHkwID09PSB5MSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGUyID0gMiAqIGVycjtcbiAgICAgICAgaWYgKGUyID4gLWR5KSB7XG4gICAgICAgICAgICBlcnIgPSBlcnIgLSBkeTtcbiAgICAgICAgICAgIHgwID0geDAgKyBzeDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZTIgPCBkeCkge1xuICAgICAgICAgICAgZXJyID0gZXJyICsgZHg7XG4gICAgICAgICAgICB5MCA9IHkwICsgc3k7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGluZTtcbn1cbmV4cG9ydHMuZ2V0TGluZSA9IGdldExpbmU7XG5cblxuLyoqXG4gKiBTbW9vdGhlbiB0aGUgZ2l2ZSBwYXRoLlxuICogVGhlIG9yaWdpbmFsIHBhdGggd2lsbCBub3QgYmUgbW9kaWZpZWQ7IGEgbmV3IHBhdGggd2lsbCBiZSByZXR1cm5lZC5cbiAqIEBwYXJhbSB7UEYuR3JpZH0gZ3JpZFxuICogQHBhcmFtIHtBcnJheS48QXJyYXkuPG51bWJlcj4+fSBwYXRoIFRoZSBwYXRoXG4gKiBAcmV0dXJuIHtBcnJheS48QXJyYXkuPG51bWJlcj4+fSBTbW9vdGhlbmVkIHBhdGhcbiAqL1xuZnVuY3Rpb24gc21vb3RoZW5QYXRoKGdyaWQsIHBhdGgpIHtcbiAgICB2YXIgbGVuID0gcGF0aC5sZW5ndGgsXG4gICAgICAgIHgwID0gcGF0aFswXVswXSwgICAgICAgIC8vIHBhdGggc3RhcnQgeFxuICAgICAgICB5MCA9IHBhdGhbMF1bMV0sICAgICAgICAvLyBwYXRoIHN0YXJ0IHlcbiAgICAgICAgeDEgPSBwYXRoW2xlbiAtIDFdWzBdLCAgLy8gcGF0aCBlbmQgeFxuICAgICAgICB5MSA9IHBhdGhbbGVuIC0gMV1bMV0sICAvLyBwYXRoIGVuZCB5XG4gICAgICAgIHN4LCBzeSwgICAgICAgICAgICAgICAgIC8vIGN1cnJlbnQgc3RhcnQgY29vcmRpbmF0ZVxuICAgICAgICBleCwgZXksICAgICAgICAgICAgICAgICAvLyBjdXJyZW50IGVuZCBjb29yZGluYXRlXG4gICAgICAgIGx4LCBseSwgICAgICAgICAgICAgICAgIC8vIGxhc3QgdmFsaWQgZW5kIGNvb3JkaW5hdGVcbiAgICAgICAgbmV3UGF0aCxcbiAgICAgICAgaSwgaiwgY29vcmQsIGxpbmUsIHRlc3RDb29yZCwgYmxvY2tlZDtcblxuICAgIHN4ID0geDA7XG4gICAgc3kgPSB5MDtcbiAgICBseCA9IHBhdGhbMV1bMF07XG4gICAgbHkgPSBwYXRoWzFdWzFdO1xuICAgIG5ld1BhdGggPSBbW3N4LCBzeV1dO1xuXG4gICAgZm9yIChpID0gMjsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIGNvb3JkID0gcGF0aFtpXTtcbiAgICAgICAgZXggPSBjb29yZFswXTtcbiAgICAgICAgZXkgPSBjb29yZFsxXTtcbiAgICAgICAgbGluZSA9IGdldExpbmUoc3gsIHN5LCBleCwgZXkpO1xuXG4gICAgICAgIGJsb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGxpbmUubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIHRlc3RDb29yZCA9IGxpbmVbal07XG5cbiAgICAgICAgICAgIGlmICghZ3JpZC5pc1dhbGthYmxlQXQodGVzdENvb3JkWzBdLCB0ZXN0Q29vcmRbMV0pKSB7XG4gICAgICAgICAgICAgICAgYmxvY2tlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbmV3UGF0aC5wdXNoKFtseCwgbHldKTtcbiAgICAgICAgICAgICAgICBzeCA9IGx4O1xuICAgICAgICAgICAgICAgIHN5ID0gbHk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFibG9ja2VkKSB7XG4gICAgICAgICAgICBseCA9IGV4O1xuICAgICAgICAgICAgbHkgPSBleTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBuZXdQYXRoLnB1c2goW3gxLCB5MV0pO1xuXG4gICAgcmV0dXJuIG5ld1BhdGg7XG59XG5leHBvcnRzLnNtb290aGVuUGF0aCA9IHNtb290aGVuUGF0aDtcbiIsInZhciBIZWFwICAgICAgID0gcmVxdWlyZSgnLi4vY29yZS9IZWFwJyk7XG52YXIgVXRpbCAgICAgICA9IHJlcXVpcmUoJy4uL2NvcmUvVXRpbCcpO1xudmFyIEhldXJpc3RpYyAgPSByZXF1aXJlKCcuLi9jb3JlL0hldXJpc3RpYycpO1xuXG4vKipcbiAqIEEqIHBhdGgtZmluZGVyLlxuICogYmFzZWQgdXBvbiBodHRwczovL2dpdGh1Yi5jb20vYmdyaW5zL2phdmFzY3JpcHQtYXN0YXJcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtvYmplY3R9IG9wdFxuICogQHBhcmFtIHtib29sZWFufSBvcHQuYWxsb3dEaWFnb25hbCBXaGV0aGVyIGRpYWdvbmFsIG1vdmVtZW50IGlzIGFsbG93ZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdC5kb250Q3Jvc3NDb3JuZXJzIERpc2FsbG93IGRpYWdvbmFsIG1vdmVtZW50IHRvdWNoaW5nIGJsb2NrIGNvcm5lcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcHQuaGV1cmlzdGljIEhldXJpc3RpYyBmdW5jdGlvbiB0byBlc3RpbWF0ZSB0aGUgZGlzdGFuY2VcbiAqICAgICAoZGVmYXVsdHMgdG8gbWFuaGF0dGFuKS5cbiAqIEBwYXJhbSB7aW50ZWdlcn0gb3B0LndlaWdodCBXZWlnaHQgdG8gYXBwbHkgdG8gdGhlIGhldXJpc3RpYyB0byBhbGxvdyBmb3Igc3Vib3B0aW1hbCBwYXRocywgXG4gKiAgICAgaW4gb3JkZXIgdG8gc3BlZWQgdXAgdGhlIHNlYXJjaC5cbiAqL1xuZnVuY3Rpb24gQVN0YXJGaW5kZXIob3B0KSB7XG4gICAgb3B0ID0gb3B0IHx8IHt9O1xuICAgIHRoaXMuYWxsb3dEaWFnb25hbCA9IG9wdC5hbGxvd0RpYWdvbmFsO1xuICAgIHRoaXMuZG9udENyb3NzQ29ybmVycyA9IG9wdC5kb250Q3Jvc3NDb3JuZXJzO1xuICAgIHRoaXMuaGV1cmlzdGljID0gb3B0LmhldXJpc3RpYyB8fCBIZXVyaXN0aWMubWFuaGF0dGFuO1xuICAgIHRoaXMud2VpZ2h0ID0gb3B0LndlaWdodCB8fMKgMTtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCByZXR1cm4gdGhlIHRoZSBwYXRoLlxuICogQHJldHVybiB7QXJyYXkuPFtudW1iZXIsIG51bWJlcl0+fSBUaGUgcGF0aCwgaW5jbHVkaW5nIGJvdGggc3RhcnQgYW5kXG4gKiAgICAgZW5kIHBvc2l0aW9ucy5cbiAqL1xuQVN0YXJGaW5kZXIucHJvdG90eXBlLmZpbmRQYXRoID0gZnVuY3Rpb24oc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFksIGdyaWQpIHtcbiAgICB2YXIgb3Blbkxpc3QgPSBuZXcgSGVhcChmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlQS5mIC0gbm9kZUIuZjtcbiAgICAgICAgfSksXG4gICAgICAgIHN0YXJ0Tm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KHN0YXJ0WCwgc3RhcnRZKSxcbiAgICAgICAgZW5kTm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KGVuZFgsIGVuZFkpLFxuICAgICAgICBoZXVyaXN0aWMgPSB0aGlzLmhldXJpc3RpYyxcbiAgICAgICAgYWxsb3dEaWFnb25hbCA9IHRoaXMuYWxsb3dEaWFnb25hbCxcbiAgICAgICAgZG9udENyb3NzQ29ybmVycyA9IHRoaXMuZG9udENyb3NzQ29ybmVycyxcbiAgICAgICAgd2VpZ2h0ID0gdGhpcy53ZWlnaHQsXG4gICAgICAgIGFicyA9IE1hdGguYWJzLCBTUVJUMiA9IE1hdGguU1FSVDIsXG4gICAgICAgIG5vZGUsIG5laWdoYm9ycywgbmVpZ2hib3IsIGksIGwsIHgsIHksIG5nO1xuXG4gICAgLy8gc2V0IHRoZSBgZ2AgYW5kIGBmYCB2YWx1ZSBvZiB0aGUgc3RhcnQgbm9kZSB0byBiZSAwXG4gICAgc3RhcnROb2RlLmcgPSAwO1xuICAgIHN0YXJ0Tm9kZS5mID0gMDtcblxuICAgIC8vIHB1c2ggdGhlIHN0YXJ0IG5vZGUgaW50byB0aGUgb3BlbiBsaXN0XG4gICAgb3Blbkxpc3QucHVzaChzdGFydE5vZGUpO1xuICAgIHN0YXJ0Tm9kZS5vcGVuZWQgPSB0cnVlO1xuXG4gICAgLy8gd2hpbGUgdGhlIG9wZW4gbGlzdCBpcyBub3QgZW1wdHlcbiAgICB3aGlsZSAoIW9wZW5MaXN0LmVtcHR5KCkpIHtcbiAgICAgICAgLy8gcG9wIHRoZSBwb3NpdGlvbiBvZiBub2RlIHdoaWNoIGhhcyB0aGUgbWluaW11bSBgZmAgdmFsdWUuXG4gICAgICAgIG5vZGUgPSBvcGVuTGlzdC5wb3AoKTtcbiAgICAgICAgbm9kZS5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIGlmIHJlYWNoZWQgdGhlIGVuZCBwb3NpdGlvbiwgY29uc3RydWN0IHRoZSBwYXRoIGFuZCByZXR1cm4gaXRcbiAgICAgICAgaWYgKG5vZGUgPT09IGVuZE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBVdGlsLmJhY2t0cmFjZShlbmROb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCBuZWlnYm91cnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICAgICAgICBuZWlnaGJvcnMgPSBncmlkLmdldE5laWdoYm9ycyhub2RlLCBhbGxvd0RpYWdvbmFsLCBkb250Q3Jvc3NDb3JuZXJzKTtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IG5laWdoYm9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuXG4gICAgICAgICAgICBpZiAobmVpZ2hib3IuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHggPSBuZWlnaGJvci54O1xuICAgICAgICAgICAgeSA9IG5laWdoYm9yLnk7XG5cbiAgICAgICAgICAgIC8vIGdldCB0aGUgZGlzdGFuY2UgYmV0d2VlbiBjdXJyZW50IG5vZGUgYW5kIHRoZSBuZWlnaGJvclxuICAgICAgICAgICAgLy8gYW5kIGNhbGN1bGF0ZSB0aGUgbmV4dCBnIHNjb3JlXG4gICAgICAgICAgICBuZyA9IG5vZGUuZyArICgoeCAtIG5vZGUueCA9PT0gMCB8fCB5IC0gbm9kZS55ID09PSAwKSA/IDEgOiBTUVJUMik7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBuZWlnaGJvciBoYXMgbm90IGJlZW4gaW5zcGVjdGVkIHlldCwgb3JcbiAgICAgICAgICAgIC8vIGNhbiBiZSByZWFjaGVkIHdpdGggc21hbGxlciBjb3N0IGZyb20gdGhlIGN1cnJlbnQgbm9kZVxuICAgICAgICAgICAgaWYgKCFuZWlnaGJvci5vcGVuZWQgfHwgbmcgPCBuZWlnaGJvci5nKSB7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3IuZyA9IG5nO1xuICAgICAgICAgICAgICAgIG5laWdoYm9yLmggPSBuZWlnaGJvci5oIHx8IHdlaWdodCAqIGhldXJpc3RpYyhhYnMoeCAtIGVuZFgpLCBhYnMoeSAtIGVuZFkpKTtcbiAgICAgICAgICAgICAgICBuZWlnaGJvci5mID0gbmVpZ2hib3IuZyArIG5laWdoYm9yLmg7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3IucGFyZW50ID0gbm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICghbmVpZ2hib3Iub3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wZW5MaXN0LnB1c2gobmVpZ2hib3IpO1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvci5vcGVuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBuZWlnaGJvciBjYW4gYmUgcmVhY2hlZCB3aXRoIHNtYWxsZXIgY29zdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2luY2UgaXRzIGYgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCwgd2UgaGF2ZSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgaXRzIHBvc2l0aW9uIGluIHRoZSBvcGVuIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgb3Blbkxpc3QudXBkYXRlSXRlbShuZWlnaGJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IC8vIGVuZCBmb3IgZWFjaCBuZWlnaGJvclxuICAgIH0gLy8gZW5kIHdoaWxlIG5vdCBvcGVuIGxpc3QgZW1wdHlcblxuICAgIC8vIGZhaWwgdG8gZmluZCB0aGUgcGF0aFxuICAgIHJldHVybiBbXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQVN0YXJGaW5kZXI7XG4iLCJ2YXIgQVN0YXJGaW5kZXIgPSByZXF1aXJlKCcuL0FTdGFyRmluZGVyJyk7XG5cbi8qKlxuICogQmVzdC1GaXJzdC1TZWFyY2ggcGF0aC1maW5kZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEFTdGFyRmluZGVyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdC5hbGxvd0RpYWdvbmFsIFdoZXRoZXIgZGlhZ29uYWwgbW92ZW1lbnQgaXMgYWxsb3dlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0LmRvbnRDcm9zc0Nvcm5lcnMgRGlzYWxsb3cgZGlhZ29uYWwgbW92ZW1lbnQgdG91Y2hpbmcgYmxvY2sgY29ybmVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wdC5oZXVyaXN0aWMgSGV1cmlzdGljIGZ1bmN0aW9uIHRvIGVzdGltYXRlIHRoZSBkaXN0YW5jZVxuICogICAgIChkZWZhdWx0cyB0byBtYW5oYXR0YW4pLlxuICovXG5mdW5jdGlvbiBCZXN0Rmlyc3RGaW5kZXIob3B0KSB7XG4gICAgQVN0YXJGaW5kZXIuY2FsbCh0aGlzLCBvcHQpO1xuXG4gICAgdmFyIG9yaWcgPSB0aGlzLmhldXJpc3RpYztcbiAgICB0aGlzLmhldXJpc3RpYyA9IGZ1bmN0aW9uKGR4LCBkeSkge1xuICAgICAgICByZXR1cm4gb3JpZyhkeCwgZHkpICogMTAwMDAwMDtcbiAgICB9O1xufTtcblxuQmVzdEZpcnN0RmluZGVyLnByb3RvdHlwZSA9IG5ldyBBU3RhckZpbmRlcigpO1xuQmVzdEZpcnN0RmluZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJlc3RGaXJzdEZpbmRlcjtcblxubW9kdWxlLmV4cG9ydHMgPSBCZXN0Rmlyc3RGaW5kZXI7XG4iLCJ2YXIgSGVhcCAgICAgICA9IHJlcXVpcmUoJy4uL2NvcmUvSGVhcCcpO1xudmFyIFV0aWwgICAgICAgPSByZXF1aXJlKCcuLi9jb3JlL1V0aWwnKTtcbnZhciBIZXVyaXN0aWMgID0gcmVxdWlyZSgnLi4vY29yZS9IZXVyaXN0aWMnKTtcblxuLyoqXG4gKiBBKiBwYXRoLWZpbmRlci5cbiAqIGJhc2VkIHVwb24gaHR0cHM6Ly9naXRodWIuY29tL2Jncmlucy9qYXZhc2NyaXB0LWFzdGFyXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0LmFsbG93RGlhZ29uYWwgV2hldGhlciBkaWFnb25hbCBtb3ZlbWVudCBpcyBhbGxvd2VkLlxuICogQHBhcmFtIHtib29sZWFufSBvcHQuZG9udENyb3NzQ29ybmVycyBEaXNhbGxvdyBkaWFnb25hbCBtb3ZlbWVudCB0b3VjaGluZyBibG9jayBjb3JuZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gb3B0LmhldXJpc3RpYyBIZXVyaXN0aWMgZnVuY3Rpb24gdG8gZXN0aW1hdGUgdGhlIGRpc3RhbmNlXG4gKiAgICAgKGRlZmF1bHRzIHRvIG1hbmhhdHRhbikuXG4gKiBAcGFyYW0ge2ludGVnZXJ9IG9wdC53ZWlnaHQgV2VpZ2h0IHRvIGFwcGx5IHRvIHRoZSBoZXVyaXN0aWMgdG8gYWxsb3cgZm9yIHN1Ym9wdGltYWwgcGF0aHMsIFxuICogICAgIGluIG9yZGVyIHRvIHNwZWVkIHVwIHRoZSBzZWFyY2guXG4gKi9cbmZ1bmN0aW9uIEJpQVN0YXJGaW5kZXIob3B0KSB7XG4gICAgb3B0ID0gb3B0IHx8IHt9O1xuICAgIHRoaXMuYWxsb3dEaWFnb25hbCA9IG9wdC5hbGxvd0RpYWdvbmFsO1xuICAgIHRoaXMuZG9udENyb3NzQ29ybmVycyA9IG9wdC5kb250Q3Jvc3NDb3JuZXJzO1xuICAgIHRoaXMuaGV1cmlzdGljID0gb3B0LmhldXJpc3RpYyB8fCBIZXVyaXN0aWMubWFuaGF0dGFuO1xuICAgIHRoaXMud2VpZ2h0ID0gb3B0LndlaWdodCB8fMKgMTtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCByZXR1cm4gdGhlIHRoZSBwYXRoLlxuICogQHJldHVybiB7QXJyYXkuPFtudW1iZXIsIG51bWJlcl0+fSBUaGUgcGF0aCwgaW5jbHVkaW5nIGJvdGggc3RhcnQgYW5kXG4gKiAgICAgZW5kIHBvc2l0aW9ucy5cbiAqL1xuQmlBU3RhckZpbmRlci5wcm90b3R5cGUuZmluZFBhdGggPSBmdW5jdGlvbihzdGFydFgsIHN0YXJ0WSwgZW5kWCwgZW5kWSwgZ3JpZCkge1xuICAgIHZhciBjbXAgPSBmdW5jdGlvbihub2RlQSwgbm9kZUIpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlQS5mIC0gbm9kZUIuZjtcbiAgICAgICAgfSxcbiAgICAgICAgc3RhcnRPcGVuTGlzdCA9IG5ldyBIZWFwKGNtcCksXG4gICAgICAgIGVuZE9wZW5MaXN0ID0gbmV3IEhlYXAoY21wKSxcbiAgICAgICAgc3RhcnROb2RlID0gZ3JpZC5nZXROb2RlQXQoc3RhcnRYLCBzdGFydFkpLFxuICAgICAgICBlbmROb2RlID0gZ3JpZC5nZXROb2RlQXQoZW5kWCwgZW5kWSksXG4gICAgICAgIGhldXJpc3RpYyA9IHRoaXMuaGV1cmlzdGljLFxuICAgICAgICBhbGxvd0RpYWdvbmFsID0gdGhpcy5hbGxvd0RpYWdvbmFsLFxuICAgICAgICBkb250Q3Jvc3NDb3JuZXJzID0gdGhpcy5kb250Q3Jvc3NDb3JuZXJzLFxuICAgICAgICB3ZWlnaHQgPSB0aGlzLndlaWdodCxcbiAgICAgICAgYWJzID0gTWF0aC5hYnMsIFNRUlQyID0gTWF0aC5TUVJUMixcbiAgICAgICAgbm9kZSwgbmVpZ2hib3JzLCBuZWlnaGJvciwgaSwgbCwgeCwgeSwgbmcsXG4gICAgICAgIEJZX1NUQVJUID0gMSwgQllfRU5EID0gMjtcblxuICAgIC8vIHNldCB0aGUgYGdgIGFuZCBgZmAgdmFsdWUgb2YgdGhlIHN0YXJ0IG5vZGUgdG8gYmUgMFxuICAgIC8vIGFuZCBwdXNoIGl0IGludG8gdGhlIHN0YXJ0IG9wZW4gbGlzdFxuICAgIHN0YXJ0Tm9kZS5nID0gMDtcbiAgICBzdGFydE5vZGUuZiA9IDA7XG4gICAgc3RhcnRPcGVuTGlzdC5wdXNoKHN0YXJ0Tm9kZSk7XG4gICAgc3RhcnROb2RlLm9wZW5lZCA9IEJZX1NUQVJUO1xuXG4gICAgLy8gc2V0IHRoZSBgZ2AgYW5kIGBmYCB2YWx1ZSBvZiB0aGUgZW5kIG5vZGUgdG8gYmUgMFxuICAgIC8vIGFuZCBwdXNoIGl0IGludG8gdGhlIG9wZW4gb3BlbiBsaXN0XG4gICAgZW5kTm9kZS5nID0gMDtcbiAgICBlbmROb2RlLmYgPSAwO1xuICAgIGVuZE9wZW5MaXN0LnB1c2goZW5kTm9kZSk7XG4gICAgZW5kTm9kZS5vcGVuZWQgPSBCWV9FTkQ7XG5cbiAgICAvLyB3aGlsZSBib3RoIHRoZSBvcGVuIGxpc3RzIGFyZSBub3QgZW1wdHlcbiAgICB3aGlsZSAoIXN0YXJ0T3Blbkxpc3QuZW1wdHkoKSAmJiAhZW5kT3Blbkxpc3QuZW1wdHkoKSkge1xuXG4gICAgICAgIC8vIHBvcCB0aGUgcG9zaXRpb24gb2Ygc3RhcnQgbm9kZSB3aGljaCBoYXMgdGhlIG1pbmltdW0gYGZgIHZhbHVlLlxuICAgICAgICBub2RlID0gc3RhcnRPcGVuTGlzdC5wb3AoKTtcbiAgICAgICAgbm9kZS5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIGdldCBuZWlnYm91cnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICAgICAgICBuZWlnaGJvcnMgPSBncmlkLmdldE5laWdoYm9ycyhub2RlLCBhbGxvd0RpYWdvbmFsLCBkb250Q3Jvc3NDb3JuZXJzKTtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IG5laWdoYm9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuXG4gICAgICAgICAgICBpZiAobmVpZ2hib3IuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmVpZ2hib3Iub3BlbmVkID09PSBCWV9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVXRpbC5iaUJhY2t0cmFjZShub2RlLCBuZWlnaGJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHggPSBuZWlnaGJvci54O1xuICAgICAgICAgICAgeSA9IG5laWdoYm9yLnk7XG5cbiAgICAgICAgICAgIC8vIGdldCB0aGUgZGlzdGFuY2UgYmV0d2VlbiBjdXJyZW50IG5vZGUgYW5kIHRoZSBuZWlnaGJvclxuICAgICAgICAgICAgLy8gYW5kIGNhbGN1bGF0ZSB0aGUgbmV4dCBnIHNjb3JlXG4gICAgICAgICAgICBuZyA9IG5vZGUuZyArICgoeCAtIG5vZGUueCA9PT0gMCB8fCB5IC0gbm9kZS55ID09PSAwKSA/IDEgOiBTUVJUMik7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBuZWlnaGJvciBoYXMgbm90IGJlZW4gaW5zcGVjdGVkIHlldCwgb3JcbiAgICAgICAgICAgIC8vIGNhbiBiZSByZWFjaGVkIHdpdGggc21hbGxlciBjb3N0IGZyb20gdGhlIGN1cnJlbnQgbm9kZVxuICAgICAgICAgICAgaWYgKCFuZWlnaGJvci5vcGVuZWQgfHwgbmcgPCBuZWlnaGJvci5nKSB7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3IuZyA9IG5nO1xuICAgICAgICAgICAgICAgIG5laWdoYm9yLmggPSBuZWlnaGJvci5oIHx8IHdlaWdodCAqIGhldXJpc3RpYyhhYnMoeCAtIGVuZFgpLCBhYnMoeSAtIGVuZFkpKTtcbiAgICAgICAgICAgICAgICBuZWlnaGJvci5mID0gbmVpZ2hib3IuZyArIG5laWdoYm9yLmg7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3IucGFyZW50ID0gbm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICghbmVpZ2hib3Iub3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0T3Blbkxpc3QucHVzaChuZWlnaGJvcik7XG4gICAgICAgICAgICAgICAgICAgIG5laWdoYm9yLm9wZW5lZCA9IEJZX1NUQVJUO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBuZWlnaGJvciBjYW4gYmUgcmVhY2hlZCB3aXRoIHNtYWxsZXIgY29zdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2luY2UgaXRzIGYgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCwgd2UgaGF2ZSB0b1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgaXRzIHBvc2l0aW9uIGluIHRoZSBvcGVuIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRPcGVuTGlzdC51cGRhdGVJdGVtKG5laWdoYm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gLy8gZW5kIGZvciBlYWNoIG5laWdoYm9yXG5cblxuICAgICAgICAvLyBwb3AgdGhlIHBvc2l0aW9uIG9mIGVuZCBub2RlIHdoaWNoIGhhcyB0aGUgbWluaW11bSBgZmAgdmFsdWUuXG4gICAgICAgIG5vZGUgPSBlbmRPcGVuTGlzdC5wb3AoKTtcbiAgICAgICAgbm9kZS5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIGdldCBuZWlnYm91cnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICAgICAgICBuZWlnaGJvcnMgPSBncmlkLmdldE5laWdoYm9ycyhub2RlLCBhbGxvd0RpYWdvbmFsLCBkb250Q3Jvc3NDb3JuZXJzKTtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IG5laWdoYm9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuXG4gICAgICAgICAgICBpZiAobmVpZ2hib3IuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmVpZ2hib3Iub3BlbmVkID09PSBCWV9TVEFSVCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBVdGlsLmJpQmFja3RyYWNlKG5laWdoYm9yLCBub2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeCA9IG5laWdoYm9yLng7XG4gICAgICAgICAgICB5ID0gbmVpZ2hib3IueTtcblxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIGN1cnJlbnQgbm9kZSBhbmQgdGhlIG5laWdoYm9yXG4gICAgICAgICAgICAvLyBhbmQgY2FsY3VsYXRlIHRoZSBuZXh0IGcgc2NvcmVcbiAgICAgICAgICAgIG5nID0gbm9kZS5nICsgKCh4IC0gbm9kZS54ID09PSAwIHx8IHkgLSBub2RlLnkgPT09IDApID8gMSA6IFNRUlQyKTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIG5laWdoYm9yIGhhcyBub3QgYmVlbiBpbnNwZWN0ZWQgeWV0LCBvclxuICAgICAgICAgICAgLy8gY2FuIGJlIHJlYWNoZWQgd2l0aCBzbWFsbGVyIGNvc3QgZnJvbSB0aGUgY3VycmVudCBub2RlXG4gICAgICAgICAgICBpZiAoIW5laWdoYm9yLm9wZW5lZCB8fCBuZyA8IG5laWdoYm9yLmcpIHtcbiAgICAgICAgICAgICAgICBuZWlnaGJvci5nID0gbmc7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3IuaCA9IG5laWdoYm9yLmggfHwgd2VpZ2h0ICogaGV1cmlzdGljKGFicyh4IC0gc3RhcnRYKSwgYWJzKHkgLSBzdGFydFkpKTtcbiAgICAgICAgICAgICAgICBuZWlnaGJvci5mID0gbmVpZ2hib3IuZyArIG5laWdoYm9yLmg7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3IucGFyZW50ID0gbm9kZTtcblxuICAgICAgICAgICAgICAgIGlmICghbmVpZ2hib3Iub3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGVuZE9wZW5MaXN0LnB1c2gobmVpZ2hib3IpO1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvci5vcGVuZWQgPSBCWV9FTkQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIG5laWdoYm9yIGNhbiBiZSByZWFjaGVkIHdpdGggc21hbGxlciBjb3N0LlxuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSBpdHMgZiB2YWx1ZSBoYXMgYmVlbiB1cGRhdGVkLCB3ZSBoYXZlIHRvXG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBpdHMgcG9zaXRpb24gaW4gdGhlIG9wZW4gbGlzdFxuICAgICAgICAgICAgICAgICAgICBlbmRPcGVuTGlzdC51cGRhdGVJdGVtKG5laWdoYm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gLy8gZW5kIGZvciBlYWNoIG5laWdoYm9yXG4gICAgfSAvLyBlbmQgd2hpbGUgbm90IG9wZW4gbGlzdCBlbXB0eVxuXG4gICAgLy8gZmFpbCB0byBmaW5kIHRoZSBwYXRoXG4gICAgcmV0dXJuIFtdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCaUFTdGFyRmluZGVyO1xuIiwidmFyIEJpQVN0YXJGaW5kZXIgPSByZXF1aXJlKCcuL0JpQVN0YXJGaW5kZXInKTtcblxuLyoqXG4gKiBCaS1kaXJlY2l0aW9uYWwgQmVzdC1GaXJzdC1TZWFyY2ggcGF0aC1maW5kZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEJpQVN0YXJGaW5kZXJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0LmFsbG93RGlhZ29uYWwgV2hldGhlciBkaWFnb25hbCBtb3ZlbWVudCBpcyBhbGxvd2VkLlxuICogQHBhcmFtIHtib29sZWFufSBvcHQuZG9udENyb3NzQ29ybmVycyBEaXNhbGxvdyBkaWFnb25hbCBtb3ZlbWVudCB0b3VjaGluZyBibG9jayBjb3JuZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gb3B0LmhldXJpc3RpYyBIZXVyaXN0aWMgZnVuY3Rpb24gdG8gZXN0aW1hdGUgdGhlIGRpc3RhbmNlXG4gKiAgICAgKGRlZmF1bHRzIHRvIG1hbmhhdHRhbikuXG4gKi9cbmZ1bmN0aW9uIEJpQmVzdEZpcnN0RmluZGVyKG9wdCkge1xuICAgIEJpQVN0YXJGaW5kZXIuY2FsbCh0aGlzLCBvcHQpO1xuXG4gICAgdmFyIG9yaWcgPSB0aGlzLmhldXJpc3RpYztcbiAgICB0aGlzLmhldXJpc3RpYyA9IGZ1bmN0aW9uKGR4LCBkeSkge1xuICAgICAgICByZXR1cm4gb3JpZyhkeCwgZHkpICogMTAwMDAwMDtcbiAgICB9O1xufVxuXG5CaUJlc3RGaXJzdEZpbmRlci5wcm90b3R5cGUgPSBuZXcgQmlBU3RhckZpbmRlcigpO1xuQmlCZXN0Rmlyc3RGaW5kZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmlCZXN0Rmlyc3RGaW5kZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gQmlCZXN0Rmlyc3RGaW5kZXI7XG4iLCJ2YXIgVXRpbCA9IHJlcXVpcmUoJy4uL2NvcmUvVXRpbCcpO1xuXG4vKipcbiAqIEJpLWRpcmVjdGlvbmFsIEJyZWFkdGgtRmlyc3QtU2VhcmNoIHBhdGggZmluZGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdC5hbGxvd0RpYWdvbmFsIFdoZXRoZXIgZGlhZ29uYWwgbW92ZW1lbnQgaXMgYWxsb3dlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0LmRvbnRDcm9zc0Nvcm5lcnMgRGlzYWxsb3cgZGlhZ29uYWwgbW92ZW1lbnQgdG91Y2hpbmcgYmxvY2sgY29ybmVycy5cbiAqL1xuZnVuY3Rpb24gQmlCcmVhZHRoRmlyc3RGaW5kZXIob3B0KSB7XG4gICAgb3B0ID0gb3B0IHx8IHt9O1xuICAgIHRoaXMuYWxsb3dEaWFnb25hbCA9IG9wdC5hbGxvd0RpYWdvbmFsO1xuICAgIHRoaXMuZG9udENyb3NzQ29ybmVycyA9IG9wdC5kb250Q3Jvc3NDb3JuZXJzO1xufVxuXG5cbi8qKlxuICogRmluZCBhbmQgcmV0dXJuIHRoZSB0aGUgcGF0aC5cbiAqIEByZXR1cm4ge0FycmF5LjxbbnVtYmVyLCBudW1iZXJdPn0gVGhlIHBhdGgsIGluY2x1ZGluZyBib3RoIHN0YXJ0IGFuZFxuICogICAgIGVuZCBwb3NpdGlvbnMuXG4gKi9cbkJpQnJlYWR0aEZpcnN0RmluZGVyLnByb3RvdHlwZS5maW5kUGF0aCA9IGZ1bmN0aW9uKHN0YXJ0WCwgc3RhcnRZLCBlbmRYLCBlbmRZLCBncmlkKSB7XG4gICAgdmFyIHN0YXJ0Tm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KHN0YXJ0WCwgc3RhcnRZKSxcbiAgICAgICAgZW5kTm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KGVuZFgsIGVuZFkpLFxuICAgICAgICBzdGFydE9wZW5MaXN0ID0gW10sIGVuZE9wZW5MaXN0ID0gW10sXG4gICAgICAgIG5laWdoYm9ycywgbmVpZ2hib3IsIG5vZGUsXG4gICAgICAgIGFsbG93RGlhZ29uYWwgPSB0aGlzLmFsbG93RGlhZ29uYWwsXG4gICAgICAgIGRvbnRDcm9zc0Nvcm5lcnMgPSB0aGlzLmRvbnRDcm9zc0Nvcm5lcnMsXG4gICAgICAgIEJZX1NUQVJUID0gMCwgQllfRU5EID0gMSxcbiAgICAgICAgaSwgbDtcblxuICAgIC8vIHB1c2ggdGhlIHN0YXJ0IGFuZCBlbmQgbm9kZXMgaW50byB0aGUgcXVldWVzXG4gICAgc3RhcnRPcGVuTGlzdC5wdXNoKHN0YXJ0Tm9kZSk7XG4gICAgc3RhcnROb2RlLm9wZW5lZCA9IHRydWU7XG4gICAgc3RhcnROb2RlLmJ5ID0gQllfU1RBUlQ7XG5cbiAgICBlbmRPcGVuTGlzdC5wdXNoKGVuZE5vZGUpO1xuICAgIGVuZE5vZGUub3BlbmVkID0gdHJ1ZTtcbiAgICBlbmROb2RlLmJ5ID0gQllfRU5EO1xuXG4gICAgLy8gd2hpbGUgYm90aCB0aGUgcXVldWVzIGFyZSBub3QgZW1wdHlcbiAgICB3aGlsZSAoc3RhcnRPcGVuTGlzdC5sZW5ndGggJiYgZW5kT3Blbkxpc3QubGVuZ3RoKSB7XG5cbiAgICAgICAgLy8gZXhwYW5kIHN0YXJ0IG9wZW4gbGlzdFxuXG4gICAgICAgIG5vZGUgPSBzdGFydE9wZW5MaXN0LnNoaWZ0KCk7XG4gICAgICAgIG5vZGUuY2xvc2VkID0gdHJ1ZTtcblxuICAgICAgICBuZWlnaGJvcnMgPSBncmlkLmdldE5laWdoYm9ycyhub2RlLCBhbGxvd0RpYWdvbmFsLCBkb250Q3Jvc3NDb3JuZXJzKTtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IG5laWdoYm9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIG5laWdoYm9yID0gbmVpZ2hib3JzW2ldO1xuXG4gICAgICAgICAgICBpZiAobmVpZ2hib3IuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmVpZ2hib3Iub3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBub2RlIGhhcyBiZWVuIGluc3BlY3RlZCBieSB0aGUgcmV2ZXJzZWQgc2VhcmNoLFxuICAgICAgICAgICAgICAgIC8vIHRoZW4gYSBwYXRoIGlzIGZvdW5kLlxuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvci5ieSA9PT0gQllfRU5EKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVdGlsLmJpQmFja3RyYWNlKG5vZGUsIG5laWdoYm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGFydE9wZW5MaXN0LnB1c2gobmVpZ2hib3IpO1xuICAgICAgICAgICAgbmVpZ2hib3IucGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgIG5laWdoYm9yLm9wZW5lZCA9IHRydWU7XG4gICAgICAgICAgICBuZWlnaGJvci5ieSA9IEJZX1NUQVJUO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXhwYW5kIGVuZCBvcGVuIGxpc3RcblxuICAgICAgICBub2RlID0gZW5kT3Blbkxpc3Quc2hpZnQoKTtcbiAgICAgICAgbm9kZS5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIG5laWdoYm9ycyA9IGdyaWQuZ2V0TmVpZ2hib3JzKG5vZGUsIGFsbG93RGlhZ29uYWwsIGRvbnRDcm9zc0Nvcm5lcnMpO1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gbmVpZ2hib3JzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG5cbiAgICAgICAgICAgIGlmIChuZWlnaGJvci5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZWlnaGJvci5vcGVuZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAobmVpZ2hib3IuYnkgPT09IEJZX1NUQVJUKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBVdGlsLmJpQmFja3RyYWNlKG5laWdoYm9yLCBub2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbmRPcGVuTGlzdC5wdXNoKG5laWdoYm9yKTtcbiAgICAgICAgICAgIG5laWdoYm9yLnBhcmVudCA9IG5vZGU7XG4gICAgICAgICAgICBuZWlnaGJvci5vcGVuZWQgPSB0cnVlO1xuICAgICAgICAgICAgbmVpZ2hib3IuYnkgPSBCWV9FTkQ7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmYWlsIHRvIGZpbmQgdGhlIHBhdGhcbiAgICByZXR1cm4gW107XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJpQnJlYWR0aEZpcnN0RmluZGVyO1xuIiwidmFyIEJpQVN0YXJGaW5kZXIgPSByZXF1aXJlKCcuL0JpQVN0YXJGaW5kZXInKTtcblxuLyoqXG4gKiBCaS1kaXJlY3Rpb25hbCBEaWprc3RyYSBwYXRoLWZpbmRlci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQmlBU3RhckZpbmRlclxuICogQHBhcmFtIHtvYmplY3R9IG9wdFxuICogQHBhcmFtIHtib29sZWFufSBvcHQuYWxsb3dEaWFnb25hbCBXaGV0aGVyIGRpYWdvbmFsIG1vdmVtZW50IGlzIGFsbG93ZWQuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdC5kb250Q3Jvc3NDb3JuZXJzIERpc2FsbG93IGRpYWdvbmFsIG1vdmVtZW50IHRvdWNoaW5nIGJsb2NrIGNvcm5lcnMuXG4gKi9cbmZ1bmN0aW9uIEJpRGlqa3N0cmFGaW5kZXIob3B0KSB7XG4gICAgQmlBU3RhckZpbmRlci5jYWxsKHRoaXMsIG9wdCk7XG4gICAgdGhpcy5oZXVyaXN0aWMgPSBmdW5jdGlvbihkeCwgZHkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfTtcbn1cblxuQmlEaWprc3RyYUZpbmRlci5wcm90b3R5cGUgPSBuZXcgQmlBU3RhckZpbmRlcigpO1xuQmlEaWprc3RyYUZpbmRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCaURpamtzdHJhRmluZGVyO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJpRGlqa3N0cmFGaW5kZXI7XG4iLCJ2YXIgVXRpbCA9IHJlcXVpcmUoJy4uL2NvcmUvVXRpbCcpO1xuXG4vKipcbiAqIEJyZWFkdGgtRmlyc3QtU2VhcmNoIHBhdGggZmluZGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdC5hbGxvd0RpYWdvbmFsIFdoZXRoZXIgZGlhZ29uYWwgbW92ZW1lbnQgaXMgYWxsb3dlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0LmRvbnRDcm9zc0Nvcm5lcnMgRGlzYWxsb3cgZGlhZ29uYWwgbW92ZW1lbnQgdG91Y2hpbmcgYmxvY2sgY29ybmVycy5cbiAqL1xuZnVuY3Rpb24gQnJlYWR0aEZpcnN0RmluZGVyKG9wdCkge1xuICAgIG9wdCA9IG9wdCB8fCB7fTtcbiAgICB0aGlzLmFsbG93RGlhZ29uYWwgPSBvcHQuYWxsb3dEaWFnb25hbDtcbiAgICB0aGlzLmRvbnRDcm9zc0Nvcm5lcnMgPSBvcHQuZG9udENyb3NzQ29ybmVycztcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCByZXR1cm4gdGhlIHRoZSBwYXRoLlxuICogQHJldHVybiB7QXJyYXkuPFtudW1iZXIsIG51bWJlcl0+fSBUaGUgcGF0aCwgaW5jbHVkaW5nIGJvdGggc3RhcnQgYW5kXG4gKiAgICAgZW5kIHBvc2l0aW9ucy5cbiAqL1xuQnJlYWR0aEZpcnN0RmluZGVyLnByb3RvdHlwZS5maW5kUGF0aCA9IGZ1bmN0aW9uKHN0YXJ0WCwgc3RhcnRZLCBlbmRYLCBlbmRZLCBncmlkKSB7XG4gICAgdmFyIG9wZW5MaXN0ID0gW10sXG4gICAgICAgIGFsbG93RGlhZ29uYWwgPSB0aGlzLmFsbG93RGlhZ29uYWwsXG4gICAgICAgIGRvbnRDcm9zc0Nvcm5lcnMgPSB0aGlzLmRvbnRDcm9zc0Nvcm5lcnMsXG4gICAgICAgIHN0YXJ0Tm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KHN0YXJ0WCwgc3RhcnRZKSxcbiAgICAgICAgZW5kTm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KGVuZFgsIGVuZFkpLFxuICAgICAgICBuZWlnaGJvcnMsIG5laWdoYm9yLCBub2RlLCBpLCBsO1xuXG4gICAgLy8gcHVzaCB0aGUgc3RhcnQgcG9zIGludG8gdGhlIHF1ZXVlXG4gICAgb3Blbkxpc3QucHVzaChzdGFydE5vZGUpO1xuICAgIHN0YXJ0Tm9kZS5vcGVuZWQgPSB0cnVlO1xuXG4gICAgLy8gd2hpbGUgdGhlIHF1ZXVlIGlzIG5vdCBlbXB0eVxuICAgIHdoaWxlIChvcGVuTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgLy8gdGFrZSB0aGUgZnJvbnQgbm9kZSBmcm9tIHRoZSBxdWV1ZVxuICAgICAgICBub2RlID0gb3Blbkxpc3Quc2hpZnQoKTtcbiAgICAgICAgbm9kZS5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIC8vIHJlYWNoZWQgdGhlIGVuZCBwb3NpdGlvblxuICAgICAgICBpZiAobm9kZSA9PT0gZW5kTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFV0aWwuYmFja3RyYWNlKGVuZE5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmVpZ2hib3JzID0gZ3JpZC5nZXROZWlnaGJvcnMobm9kZSwgYWxsb3dEaWFnb25hbCwgZG9udENyb3NzQ29ybmVycyk7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBuZWlnaGJvcnMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBuZWlnaGJvciA9IG5laWdoYm9yc1tpXTtcblxuICAgICAgICAgICAgLy8gc2tpcCB0aGlzIG5laWdoYm9yIGlmIGl0IGhhcyBiZWVuIGluc3BlY3RlZCBiZWZvcmVcbiAgICAgICAgICAgIGlmIChuZWlnaGJvci5jbG9zZWQgfHwgbmVpZ2hib3Iub3BlbmVkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wZW5MaXN0LnB1c2gobmVpZ2hib3IpO1xuICAgICAgICAgICAgbmVpZ2hib3Iub3BlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIG5laWdoYm9yLnBhcmVudCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gZmFpbCB0byBmaW5kIHRoZSBwYXRoXG4gICAgcmV0dXJuIFtdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCcmVhZHRoRmlyc3RGaW5kZXI7XG4iLCJ2YXIgQVN0YXJGaW5kZXIgPSByZXF1aXJlKCcuL0FTdGFyRmluZGVyJyk7XG5cbi8qKlxuICogRGlqa3N0cmEgcGF0aC1maW5kZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEFTdGFyRmluZGVyXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0XG4gKiBAcGFyYW0ge2Jvb2xlYW59IG9wdC5hbGxvd0RpYWdvbmFsIFdoZXRoZXIgZGlhZ29uYWwgbW92ZW1lbnQgaXMgYWxsb3dlZC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0LmRvbnRDcm9zc0Nvcm5lcnMgRGlzYWxsb3cgZGlhZ29uYWwgbW92ZW1lbnQgdG91Y2hpbmcgYmxvY2sgY29ybmVycy5cbiAqL1xuZnVuY3Rpb24gRGlqa3N0cmFGaW5kZXIob3B0KSB7XG4gICAgQVN0YXJGaW5kZXIuY2FsbCh0aGlzLCBvcHQpO1xuICAgIHRoaXMuaGV1cmlzdGljID0gZnVuY3Rpb24oZHgsIGR5KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH07XG59XG5cbkRpamtzdHJhRmluZGVyLnByb3RvdHlwZSA9IG5ldyBBU3RhckZpbmRlcigpO1xuRGlqa3N0cmFGaW5kZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGlqa3N0cmFGaW5kZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gRGlqa3N0cmFGaW5kZXI7XG4iLCIvKipcbiAqIEBhdXRob3IgYW5pZXJvIC8gaHR0cHM6Ly9naXRodWIuY29tL2FuaWVyb1xuICovXG52YXIgSGVhcCAgICAgICA9IHJlcXVpcmUoJy4uL2NvcmUvSGVhcCcpO1xudmFyIFV0aWwgICAgICAgPSByZXF1aXJlKCcuLi9jb3JlL1V0aWwnKTtcbnZhciBIZXVyaXN0aWMgID0gcmVxdWlyZSgnLi4vY29yZS9IZXVyaXN0aWMnKTtcblxuLyoqXG4gKiBQYXRoIGZpbmRlciB1c2luZyB0aGUgSnVtcCBQb2ludCBTZWFyY2ggYWxnb3JpdGhtXG4gKiBAcGFyYW0ge29iamVjdH0gb3B0XG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcHQuaGV1cmlzdGljIEhldXJpc3RpYyBmdW5jdGlvbiB0byBlc3RpbWF0ZSB0aGUgZGlzdGFuY2VcbiAqICAgICAoZGVmYXVsdHMgdG8gbWFuaGF0dGFuKS5cbiAqL1xuZnVuY3Rpb24gSnVtcFBvaW50RmluZGVyKG9wdCkge1xuICAgIG9wdCA9IG9wdCB8fCB7fTtcbiAgICB0aGlzLmhldXJpc3RpYyA9IG9wdC5oZXVyaXN0aWMgfHwgSGV1cmlzdGljLm1hbmhhdHRhbjtcbn1cblxuLyoqXG4gKiBGaW5kIGFuZCByZXR1cm4gdGhlIHBhdGguXG4gKiBAcmV0dXJuIHtBcnJheS48W251bWJlciwgbnVtYmVyXT59IFRoZSBwYXRoLCBpbmNsdWRpbmcgYm90aCBzdGFydCBhbmRcbiAqICAgICBlbmQgcG9zaXRpb25zLlxuICovXG5KdW1wUG9pbnRGaW5kZXIucHJvdG90eXBlLmZpbmRQYXRoID0gZnVuY3Rpb24oc3RhcnRYLCBzdGFydFksIGVuZFgsIGVuZFksIGdyaWQpIHtcbiAgICB2YXIgb3Blbkxpc3QgPSB0aGlzLm9wZW5MaXN0ID0gbmV3IEhlYXAoZnVuY3Rpb24obm9kZUEsIG5vZGVCKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZUEuZiAtIG5vZGVCLmY7XG4gICAgICAgIH0pLFxuICAgICAgICBzdGFydE5vZGUgPSB0aGlzLnN0YXJ0Tm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KHN0YXJ0WCwgc3RhcnRZKSxcbiAgICAgICAgZW5kTm9kZSA9IHRoaXMuZW5kTm9kZSA9IGdyaWQuZ2V0Tm9kZUF0KGVuZFgsIGVuZFkpLCBub2RlO1xuXG4gICAgdGhpcy5ncmlkID0gZ3JpZDtcblxuXG4gICAgLy8gc2V0IHRoZSBgZ2AgYW5kIGBmYCB2YWx1ZSBvZiB0aGUgc3RhcnQgbm9kZSB0byBiZSAwXG4gICAgc3RhcnROb2RlLmcgPSAwO1xuICAgIHN0YXJ0Tm9kZS5mID0gMDtcblxuICAgIC8vIHB1c2ggdGhlIHN0YXJ0IG5vZGUgaW50byB0aGUgb3BlbiBsaXN0XG4gICAgb3Blbkxpc3QucHVzaChzdGFydE5vZGUpO1xuICAgIHN0YXJ0Tm9kZS5vcGVuZWQgPSB0cnVlO1xuXG4gICAgLy8gd2hpbGUgdGhlIG9wZW4gbGlzdCBpcyBub3QgZW1wdHlcbiAgICB3aGlsZSAoIW9wZW5MaXN0LmVtcHR5KCkpIHtcbiAgICAgICAgLy8gcG9wIHRoZSBwb3NpdGlvbiBvZiBub2RlIHdoaWNoIGhhcyB0aGUgbWluaW11bSBgZmAgdmFsdWUuXG4gICAgICAgIG5vZGUgPSBvcGVuTGlzdC5wb3AoKTtcbiAgICAgICAgbm9kZS5jbG9zZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmIChub2RlID09PSBlbmROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gVXRpbC5iYWNrdHJhY2UoZW5kTm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pZGVudGlmeVN1Y2Nlc3NvcnMobm9kZSk7XG4gICAgfVxuXG4gICAgLy8gZmFpbCB0byBmaW5kIHRoZSBwYXRoXG4gICAgcmV0dXJuIFtdO1xufTtcblxuLyoqXG4gKiBJZGVudGlmeSBzdWNjZXNzb3JzIGZvciB0aGUgZ2l2ZW4gbm9kZS4gUnVucyBhIGp1bXAgcG9pbnQgc2VhcmNoIGluIHRoZVxuICogZGlyZWN0aW9uIG9mIGVhY2ggYXZhaWxhYmxlIG5laWdoYm9yLCBhZGRpbmcgYW55IHBvaW50cyBmb3VuZCB0byB0aGUgb3BlblxuICogbGlzdC5cbiAqIEBwcm90ZWN0ZWRcbiAqL1xuSnVtcFBvaW50RmluZGVyLnByb3RvdHlwZS5faWRlbnRpZnlTdWNjZXNzb3JzID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBncmlkID0gdGhpcy5ncmlkLFxuICAgICAgICBoZXVyaXN0aWMgPSB0aGlzLmhldXJpc3RpYyxcbiAgICAgICAgb3Blbkxpc3QgPSB0aGlzLm9wZW5MaXN0LFxuICAgICAgICBlbmRYID0gdGhpcy5lbmROb2RlLngsXG4gICAgICAgIGVuZFkgPSB0aGlzLmVuZE5vZGUueSxcbiAgICAgICAgbmVpZ2hib3JzLCBuZWlnaGJvcixcbiAgICAgICAganVtcFBvaW50LCBpLCBsLFxuICAgICAgICB4ID0gbm9kZS54LCB5ID0gbm9kZS55LFxuICAgICAgICBqeCwganksIGR4LCBkeSwgZCwgbmcsIGp1bXBOb2RlLFxuICAgICAgICBhYnMgPSBNYXRoLmFicywgbWF4ID0gTWF0aC5tYXg7XG5cbiAgICBuZWlnaGJvcnMgPSB0aGlzLl9maW5kTmVpZ2hib3JzKG5vZGUpO1xuICAgIGZvcihpID0gMCwgbCA9IG5laWdoYm9ycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgbmVpZ2hib3IgPSBuZWlnaGJvcnNbaV07XG4gICAgICAgIGp1bXBQb2ludCA9IHRoaXMuX2p1bXAobmVpZ2hib3JbMF0sIG5laWdoYm9yWzFdLCB4LCB5KTtcbiAgICAgICAgaWYgKGp1bXBQb2ludCkge1xuXG4gICAgICAgICAgICBqeCA9IGp1bXBQb2ludFswXTtcbiAgICAgICAgICAgIGp5ID0ganVtcFBvaW50WzFdO1xuICAgICAgICAgICAganVtcE5vZGUgPSBncmlkLmdldE5vZGVBdChqeCwgankpO1xuXG4gICAgICAgICAgICBpZiAoanVtcE5vZGUuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGluY2x1ZGUgZGlzdGFuY2UsIGFzIHBhcmVudCBtYXkgbm90IGJlIGltbWVkaWF0ZWx5IGFkamFjZW50OlxuICAgICAgICAgICAgZCA9IEhldXJpc3RpYy5ldWNsaWRlYW4oYWJzKGp4IC0geCksIGFicyhqeSAtIHkpKTtcbiAgICAgICAgICAgIG5nID0gbm9kZS5nICsgZDsgLy8gbmV4dCBgZ2AgdmFsdWVcblxuICAgICAgICAgICAgaWYgKCFqdW1wTm9kZS5vcGVuZWQgfHwgbmcgPCBqdW1wTm9kZS5nKSB7XG4gICAgICAgICAgICAgICAganVtcE5vZGUuZyA9IG5nO1xuICAgICAgICAgICAgICAgIGp1bXBOb2RlLmggPSBqdW1wTm9kZS5oIHx8IGhldXJpc3RpYyhhYnMoanggLSBlbmRYKSwgYWJzKGp5IC0gZW5kWSkpO1xuICAgICAgICAgICAgICAgIGp1bXBOb2RlLmYgPSBqdW1wTm9kZS5nICsganVtcE5vZGUuaDtcbiAgICAgICAgICAgICAgICBqdW1wTm9kZS5wYXJlbnQgPSBub2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFqdW1wTm9kZS5vcGVuZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb3Blbkxpc3QucHVzaChqdW1wTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGp1bXBOb2RlLm9wZW5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3Blbkxpc3QudXBkYXRlSXRlbShqdW1wTm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gU2VhcmNoIHJlY3Vyc2l2ZWx5IGluIHRoZSBkaXJlY3Rpb24gKHBhcmVudCAtPiBjaGlsZCksIHN0b3BwaW5nIG9ubHkgd2hlbiBhXG4gKiBqdW1wIHBvaW50IGlzIGZvdW5kLlxuICogQHByb3RlY3RlZFxuICogQHJldHVybiB7QXJyYXkuPFtudW1iZXIsIG51bWJlcl0+fSBUaGUgeCwgeSBjb29yZGluYXRlIG9mIHRoZSBqdW1wIHBvaW50XG4gKiAgICAgZm91bmQsIG9yIG51bGwgaWYgbm90IGZvdW5kXG4gKi9cbkp1bXBQb2ludEZpbmRlci5wcm90b3R5cGUuX2p1bXAgPSBmdW5jdGlvbih4LCB5LCBweCwgcHkpIHtcbiAgICB2YXIgZ3JpZCA9IHRoaXMuZ3JpZCxcbiAgICAgICAgZHggPSB4IC0gcHgsIGR5ID0geSAtIHB5LCBqeCwgank7XG5cbiAgICBpZiAoIWdyaWQuaXNXYWxrYWJsZUF0KHgsIHkpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBlbHNlIGlmIChncmlkLmdldE5vZGVBdCh4LCB5KSA9PT0gdGhpcy5lbmROb2RlKSB7XG4gICAgICAgIHJldHVybiBbeCwgeV07XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgZm9yIGZvcmNlZCBuZWlnaGJvcnNcbiAgICAvLyBhbG9uZyB0aGUgZGlhZ29uYWxcbiAgICBpZiAoZHggIT09IDAgJiYgZHkgIT09IDApIHtcbiAgICAgICAgaWYgKChncmlkLmlzV2Fsa2FibGVBdCh4IC0gZHgsIHkgKyBkeSkgJiYgIWdyaWQuaXNXYWxrYWJsZUF0KHggLSBkeCwgeSkpIHx8XG4gICAgICAgICAgICAoZ3JpZC5pc1dhbGthYmxlQXQoeCArIGR4LCB5IC0gZHkpICYmICFncmlkLmlzV2Fsa2FibGVBdCh4LCB5IC0gZHkpKSkge1xuICAgICAgICAgICAgcmV0dXJuIFt4LCB5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBob3Jpem9udGFsbHkvdmVydGljYWxseVxuICAgIGVsc2Uge1xuICAgICAgICBpZiggZHggIT09IDAgKSB7IC8vIG1vdmluZyBhbG9uZyB4XG4gICAgICAgICAgICBpZigoZ3JpZC5pc1dhbGthYmxlQXQoeCArIGR4LCB5ICsgMSkgJiYgIWdyaWQuaXNXYWxrYWJsZUF0KHgsIHkgKyAxKSkgfHxcbiAgICAgICAgICAgICAgIChncmlkLmlzV2Fsa2FibGVBdCh4ICsgZHgsIHkgLSAxKSAmJiAhZ3JpZC5pc1dhbGthYmxlQXQoeCwgeSAtIDEpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbeCwgeV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZigoZ3JpZC5pc1dhbGthYmxlQXQoeCArIDEsIHkgKyBkeSkgJiYgIWdyaWQuaXNXYWxrYWJsZUF0KHggKyAxLCB5KSkgfHxcbiAgICAgICAgICAgICAgIChncmlkLmlzV2Fsa2FibGVBdCh4IC0gMSwgeSArIGR5KSAmJiAhZ3JpZC5pc1dhbGthYmxlQXQoeCAtIDEsIHkpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbeCwgeV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB3aGVuIG1vdmluZyBkaWFnb25hbGx5LCBtdXN0IGNoZWNrIGZvciB2ZXJ0aWNhbC9ob3Jpem9udGFsIGp1bXAgcG9pbnRzXG4gICAgaWYgKGR4ICE9PSAwICYmIGR5ICE9PSAwKSB7XG4gICAgICAgIGp4ID0gdGhpcy5fanVtcCh4ICsgZHgsIHksIHgsIHkpO1xuICAgICAgICBqeSA9IHRoaXMuX2p1bXAoeCwgeSArIGR5LCB4LCB5KTtcbiAgICAgICAgaWYgKGp4IHx8IGp5KSB7XG4gICAgICAgICAgICByZXR1cm4gW3gsIHldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gbW92aW5nIGRpYWdvbmFsbHksIG11c3QgbWFrZSBzdXJlIG9uZSBvZiB0aGUgdmVydGljYWwvaG9yaXpvbnRhbFxuICAgIC8vIG5laWdoYm9ycyBpcyBvcGVuIHRvIGFsbG93IHRoZSBwYXRoXG4gICAgaWYgKGdyaWQuaXNXYWxrYWJsZUF0KHggKyBkeCwgeSkgfHwgZ3JpZC5pc1dhbGthYmxlQXQoeCwgeSArIGR5KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fanVtcCh4ICsgZHgsIHkgKyBkeSwgeCwgeSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBGaW5kIHRoZSBuZWlnaGJvcnMgZm9yIHRoZSBnaXZlbiBub2RlLiBJZiB0aGUgbm9kZSBoYXMgYSBwYXJlbnQsXG4gKiBwcnVuZSB0aGUgbmVpZ2hib3JzIGJhc2VkIG9uIHRoZSBqdW1wIHBvaW50IHNlYXJjaCBhbGdvcml0aG0sIG90aGVyd2lzZVxuICogcmV0dXJuIGFsbCBhdmFpbGFibGUgbmVpZ2hib3JzLlxuICogQHJldHVybiB7QXJyYXkuPFtudW1iZXIsIG51bWJlcl0+fSBUaGUgbmVpZ2hib3JzIGZvdW5kLlxuICovXG5KdW1wUG9pbnRGaW5kZXIucHJvdG90eXBlLl9maW5kTmVpZ2hib3JzID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHZhciBwYXJlbnQgPSBub2RlLnBhcmVudCxcbiAgICAgICAgeCA9IG5vZGUueCwgeSA9IG5vZGUueSxcbiAgICAgICAgZ3JpZCA9IHRoaXMuZ3JpZCxcbiAgICAgICAgcHgsIHB5LCBueCwgbnksIGR4LCBkeSxcbiAgICAgICAgbmVpZ2hib3JzID0gW10sIG5laWdoYm9yTm9kZXMsIG5laWdoYm9yTm9kZSwgaSwgbDtcblxuICAgIC8vIGRpcmVjdGVkIHBydW5pbmc6IGNhbiBpZ25vcmUgbW9zdCBuZWlnaGJvcnMsIHVubGVzcyBmb3JjZWQuXG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBweCA9IHBhcmVudC54O1xuICAgICAgICBweSA9IHBhcmVudC55O1xuICAgICAgICAvLyBnZXQgdGhlIG5vcm1hbGl6ZWQgZGlyZWN0aW9uIG9mIHRyYXZlbFxuICAgICAgICBkeCA9ICh4IC0gcHgpIC8gTWF0aC5tYXgoTWF0aC5hYnMoeCAtIHB4KSwgMSk7XG4gICAgICAgIGR5ID0gKHkgLSBweSkgLyBNYXRoLm1heChNYXRoLmFicyh5IC0gcHkpLCAxKTtcblxuICAgICAgICAvLyBzZWFyY2ggZGlhZ29uYWxseVxuICAgICAgICBpZiAoZHggIT09IDAgJiYgZHkgIT09IDApIHtcbiAgICAgICAgICAgIGlmIChncmlkLmlzV2Fsa2FibGVBdCh4LCB5ICsgZHkpKSB7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goW3gsIHkgKyBkeV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdyaWQuaXNXYWxrYWJsZUF0KHggKyBkeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChbeCArIGR4LCB5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ3JpZC5pc1dhbGthYmxlQXQoeCwgeSArIGR5KSB8fCBncmlkLmlzV2Fsa2FibGVBdCh4ICsgZHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goW3ggKyBkeCwgeSArIGR5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWdyaWQuaXNXYWxrYWJsZUF0KHggLSBkeCwgeSkgJiYgZ3JpZC5pc1dhbGthYmxlQXQoeCwgeSArIGR5KSkge1xuICAgICAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKFt4IC0gZHgsIHkgKyBkeV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFncmlkLmlzV2Fsa2FibGVBdCh4LCB5IC0gZHkpICYmIGdyaWQuaXNXYWxrYWJsZUF0KHggKyBkeCwgeSkpIHtcbiAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChbeCArIGR4LCB5IC0gZHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBzZWFyY2ggaG9yaXpvbnRhbGx5L3ZlcnRpY2FsbHlcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZihkeCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChncmlkLmlzV2Fsa2FibGVBdCh4LCB5ICsgZHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChncmlkLmlzV2Fsa2FibGVBdCh4LCB5ICsgZHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChbeCwgeSArIGR5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFncmlkLmlzV2Fsa2FibGVBdCh4ICsgMSwgeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKFt4ICsgMSwgeSArIGR5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFncmlkLmlzV2Fsa2FibGVBdCh4IC0gMSwgeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKFt4IC0gMSwgeSArIGR5XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZ3JpZC5pc1dhbGthYmxlQXQoeCArIGR4LCB5KSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ3JpZC5pc1dhbGthYmxlQXQoeCArIGR4LCB5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goW3ggKyBkeCwgeV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZ3JpZC5pc1dhbGthYmxlQXQoeCwgeSArIDEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChbeCArIGR4LCB5ICsgMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghZ3JpZC5pc1dhbGthYmxlQXQoeCwgeSAtIDEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChbeCArIGR4LCB5IC0gMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiBhbGwgbmVpZ2hib3JzXG4gICAgZWxzZSB7XG4gICAgICAgIG5laWdoYm9yTm9kZXMgPSBncmlkLmdldE5laWdoYm9ycyhub2RlLCB0cnVlKTtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IG5laWdoYm9yTm9kZXMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBuZWlnaGJvck5vZGUgPSBuZWlnaGJvck5vZGVzW2ldO1xuICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2goW25laWdoYm9yTm9kZS54LCBuZWlnaGJvck5vZGUueV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZWlnaGJvcnM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEp1bXBQb2ludEZpbmRlcjtcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgbWUsIHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cyovXHJcblxyXG52YXIgc2ggPSBtb2R1bGUuZXhwb3J0cyxcclxuICAgIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJykuXyxcclxuICAgIEpzb25hYmxlID0gcmVxdWlyZSgnLi9qc29uYWJsZScpLkpzb25hYmxlLFxyXG4gICAgdiA9IHJlcXVpcmUoJy4uL2dlbmVyYWwtc3R1ZmYnKS52O1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdmFyIE1vZGVsQ2hhbmdlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQSBwb2ludCBpbiB0aW1lIGluIHRoZSBTY3JpcHQgaW4gd2hpY2ggYSBjaGFuZ2UgaW4gdGhlIG1vZGVsIGhhcHBlbnMuXHJcbiAgICAgKiBFYWNoIGFjdGlvbiBoYXMgYSBtb2RlbENoYW5nZXMgQXJyYXksXHJcbiAgICAgKiB3aXRoIHRoZSBtb2RlbCBjaGFuZ2VzIG1hZGUgYnkgdGhhdCBhY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0ge2ludH0gdGltZU9mZnNldCBUaGUgdGltZSBpbiBtcyBpbiB3aGljaCB0aGlzIGNoYW5nZSBvY2N1cnMsXHJcbiAgICAgKiByZWxhdGl2ZSB0byB0aGUgYWN0aW9uJ3MgdGltZS5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGFwcGx5IFRoZSBmdW5jdGlvbiB0aGF0IHdvdWxkIGNoYW5nZSBzdHVmZiBhcm91bmQuXHJcbiAgICAgKiBAcGFyYW0ge0FjdGlvbn0gYWN0aW9uIFRoZSBhY3Rpb24gdGhhdCBvcmlnaW5hdGVkIHRoZSBtb2RlbCBjaGFuZ2UuXHJcbiAgICAgKiBAcGFyYW0ge0FjdGlvbn0gbGFiZWwgVGhlIG1vZGVsIGNoYW5nZSBsYWJlbC4gVXNlZnVsIHRvIGhhdmUgdG8gYW5pbWF0ZS5cclxuICAgICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgICBNb2RlbENoYW5nZSA9IGZ1bmN0aW9uKHRpbWVPZmZzZXQsIGFwcGx5LCBhY3Rpb24sIGxhYmVsKSB7XHJcbiAgICAgICAgdGhpcy50eXBlID0gJ01vZGVsQ2hhbmdlWycgKyBhY3Rpb24udHlwZSArICc6JyArIGxhYmVsICsgJ10nO1xyXG4gICAgICAgIGlmICh0aW1lT2Zmc2V0IDwgMCkge1xyXG4gICAgICAgICAgICB0aHJvdyAnTW9kZWxDaGFuZ2UgdGltZU9mZnNldCBjYW5cXCd0IGJlIG5lZ2F0aXZlJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50aW1lT2Zmc2V0ID0gdGltZU9mZnNldDtcclxuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICAgICAgdGhpcy5hcHBseSA9IGZ1bmN0aW9uKGJhdHRsZSkge1xyXG4gICAgICAgICAgICBhcHBseShiYXR0bGUpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBhY3Rpb247XHJcbiAgICAgICAgdGhpcy51cGRhdGVUaW1lKCk7XHJcbiAgICB9O1xyXG4gICAgTW9kZWxDaGFuZ2UucHJvdG90eXBlLnVwZGF0ZVRpbWUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRpbWUgPSB0aGlzLmFjdGlvbi50aW1lICsgdGhpcy50aW1lT2Zmc2V0O1xyXG4gICAgfTtcclxuICAgIHNoLk1vZGVsQ2hhbmdlID0gTW9kZWxDaGFuZ2U7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBIHBvaW50IGluIHRpbWUgaW4gdGhlIFNjcmlwdCBpbiB3aGljaCBhbiBhY3Rpb24gaGFwcGVucy5cclxuICAgICAqIFdoZXJlYXMgTW9kZWxDaGFuZ2UgcmVwcmVzZW50cyBhIHJhdyBjaGFuZ2UgaW4gdGhlIG1vZGVsLFxyXG4gICAgICogdGhlIGFjdGlvbiBkZXNjcmliZXMgd2h5IHRob3NlIGNoYW5nZXMgb2NjdXJyZWQuXHJcbiAgICAgKiBFeGFtcGxlOlxyXG4gICAgICogSWYgSSBoYXZlIHRoZSBhY3Rpb24gXCJBdHRhY2tcIiAsIHRoZSBjaGFuZ2UgaW4gdGhlIG1vZGVsIGZyb20gdGhhdCBhdHRhY2tcclxuICAgICAqIGlzIHRoYXQgc29tZSB1bml0IGxvc2VzIGhlYWx0aC5cclxuICAgICAqIEB0eXBlIHsqfGV4dGVuZFNoYXJlZH1cclxuICAgICAqL1xyXG4gICAgc2guQWN0aW9uID0gSnNvbmFibGUuZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICB0aW1lOiAwLC8vbXNcclxuICAgICAgICBtb2RlbENoYW5nZXM6IFtdLFxyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdBY3Rpb24nLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWyd0aW1lJ10sXHJcbiAgICAgICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2V0cyB0aGUgdGltZSB1cGRhdGluZyB0aGUgbW9kZWwgY2hhbmdlcztcclxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gdGltZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNldFRpbWU6IGZ1bmN0aW9uKHRpbWUpIHtcclxuICAgICAgICAgICAgdGhpcy50aW1lID0gdGltZTtcclxuICAgICAgICAgICAgXy5pbnZva2UodGhpcy5tb2RlbENoYW5nZXMsICd1cGRhdGVUaW1lJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZXQgdGhlIGFjdGlvbidzIG1vZGVsIGNoYW5nZXMuXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheS48e29mZnNldDppbnQsIGxhYmVsOnN0cmluZywgY2hhbmdlcjpGdW5jdGlvbn0+fSBjaGFuZ2VBcnJheVxyXG4gICAgICAgICAqIGFuIGFycmF5IG9mIGNoYW5nZXMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2V0Q2hhbmdlczogZnVuY3Rpb24oY2hhbmdlQXJyYXkpIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbENoYW5nZXMgPSBbXTtcclxuICAgICAgICAgICAgXy5lYWNoKGNoYW5nZUFycmF5LCBmdW5jdGlvbihjKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsQ2hhbmdlcy5wdXNoKG5ldyBNb2RlbENoYW5nZShjLm9mZnNldCxcclxuICAgICAgICAgICAgICAgICAgICBjLmNoYW5nZXIsIHRoaXMsIGMubGFiZWwpKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRpbWUgKyAnbXM6ICcgKyB0aGlzLnR5cGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgc2guYWN0aW9ucyA9IHt9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHVuaXQgY2hhbmdlcyB0aWxlcy5cclxuICAgICAqIEB0eXBlIHsqfVxyXG4gICAgICovXHJcbiAgICBzaC5hY3Rpb25zLk1vdmUgPSBzaC5BY3Rpb24uZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ01vdmUnLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWyd1bml0SUQnLCAnZnJvbScsICd0bycsICdkdXJhdGlvbiddLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZU1vZGVsQ2hhbmdlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5zZXRDaGFuZ2VzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdzdGFydCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuaXQgJiYgdW5pdC5pc0FsaXZlKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQubW92aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Q6IHNlbGYudG8sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyaXZhbFRpbWU6IHNlbGYudGltZSArIHNlbGYuZHVyYXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0LmJsb2NraW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NhbmNlbCB3ZWFwb24gY2hhcmdpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQuY2FuY2VsU2hpcFdlYXBvbkZpcmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBzZWxmLmR1cmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnYXJyaXZlJyxcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VyOiBmdW5jdGlvbihiYXR0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVuaXQgPSBiYXR0bGUuZ2V0VW5pdEJ5SUQoc2VsZi51bml0SUQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuaXQgJiYgdW5pdC5pc0FsaXZlKCkgJiYgIXVuaXQudGVsZXBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldiA9IHt4OiB1bml0LngsIHk6IHVuaXQueX07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0LnkgPSBzZWxmLnRvLnk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0LnggPSBzZWxmLnRvLng7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0Lm1vdmluZyA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0LmRpenp5ID0gdHJ1ZTsvL2Nhbid0IGF0dGFjayBpZiBqdXN0IGdvdCB0aGVyZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC5tb3ZlTG9jayA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXYuZXF1YWwocHJldiwgc2VsZi50bykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0LnNoaXAudW5pdHNNYXAudXBkYXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NhbmNlbCB3ZWFwb24gY2hhcmdpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQuY2FuY2VsU2hpcFdlYXBvbkZpcmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBzZWxmLmR1cmF0aW9uICsgMTAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAndW5kaXp6eScsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuaXQgJiYgdW5pdC5pc0FsaXZlKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQuZGl6enkgPSBmYWxzZTsvL25vdyBpdCBjYW4gYXR0YWNrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50aW1lICsgJ21zOiBNb3ZlICcgKyB0aGlzLnVuaXRJRCArICcgdG8gJyArXHJcbiAgICAgICAgICAgICAgICB2LnN0cih0aGlzLnRvKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBzaC5hY3Rpb25zLkF0dGFjayA9IHNoLkFjdGlvbi5leHRlbmRTaGFyZWQoe1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgICAgIGlmICghanNvbi5kYW1hZ2VEZWxheSkge1xyXG4gICAgICAgICAgICAgICAganNvbi5kYW1hZ2VEZWxheSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdBdHRhY2snLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWydhdHRhY2tlcklEJywgJ3JlY2VpdmVySUQnLCAnZGFtYWdlJywgJ2R1cmF0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgICAnZGFtYWdlRGVsYXknXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRhbWFnZURlbGF5ID4gdGhpcy5kdXJhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ0F0dGFjayBhY3Rpb25cXCdzIGRhbWFnZSBkZWxheSBjYW5cXCd0IGJlIG1vcmUgdGhhbiB0aGUgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgJ2R1cmF0aW9uJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlTW9kZWxDaGFuZ2VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnNldENoYW5nZXMoW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogMCxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ3N0YXJ0JyxcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VyOiBmdW5jdGlvbihiYXR0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dGFja2VyID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYuYXR0YWNrZXJJRCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFja2VyLm9uQ29vbGRvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiBzZWxmLmRhbWFnZURlbGF5LFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnaGl0JyxcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VyOiBmdW5jdGlvbihiYXR0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dGFja2VyID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYuYXR0YWNrZXJJRCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNlaXZlciA9IGJhdHRsZS5nZXRVbml0QnlJRChzZWxmLnJlY2VpdmVySUQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0YWNrZXIgJiYgYXR0YWNrZXIuaXNBbGl2ZSgpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjZWl2ZXIgJiYgcmVjZWl2ZXIuaXNBbGl2ZSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNlaXZlci5ocCAtPSBzZWxmLmRhbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY2FuY2VsIHdlYXBvbiBjaGFyZ2luZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjZWl2ZXIuY2FuY2VsU2hpcFdlYXBvbkZpcmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2VpdmVyLmRpc3RyYWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHNlbGYuZHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdjb29sZG93biBjb21wbGV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRhY2tlciA9IGJhdHRsZS5nZXRVbml0QnlJRChzZWxmLmF0dGFja2VySUQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0YWNrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFja2VyLm9uQ29vbGRvd24gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRpbWUgKyAnbXM6IEF0dGFjayAnICsgdGhpcy5hdHRhY2tlcklEICsgJyAtPiAnICtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVjZWl2ZXJJRDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBzaC5hY3Rpb25zLkRhbWFnZVNoaXAgPSBzaC5BY3Rpb24uZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0RhbWFnZVNoaXAnLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWydzaGlwSUQnLCAndW5pdElEJywgJ3RpbGUnLCAnZGFtYWdlJywgJ2Nvb2xkb3duJ10sXHJcbiAgICAgICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlTW9kZWxDaGFuZ2VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnNldENoYW5nZXMoW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogMCxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ3N0YXJ0JyxcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VyOiBmdW5jdGlvbihiYXR0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVuaXQgPSBiYXR0bGUuZ2V0VW5pdEJ5SUQoc2VsZi51bml0SUQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hpcCA9IGJhdHRsZS5nZXRTaGlwQnlJRChzZWxmLnNoaXBJRCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQub25Db29sZG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaXAuaHAgLT0gc2VsZi5kYW1hZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHNlbGYuY29vbGRvd24sXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdjb29sZG93biBjb21wbGV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVuaXQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQub25Db29sZG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGltZSArICdtczogRGFtYWdlU2hpcCwgZGFtYWdlOiAnICsgdGhpcy5kYW1hZ2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgc2guYWN0aW9ucy5EZWNsYXJlV2lubmVyID0gc2guQWN0aW9uLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdEZWNsYXJlV2lubmVyJyxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFsncGxheWVySUQnXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cGRhdGVNb2RlbENoYW5nZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0Q2hhbmdlcyhbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnc3RhcnQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXI6IGZ1bmN0aW9uKGJhdHRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXR0bGUud2lubmVyID0gc2VsZi5wbGF5ZXJJRDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLmFjdGlvbnMuU2V0VW5pdFByb3BlcnR5ID0gc2guQWN0aW9uLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdTZXRVbml0UHJvcGVydHknLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWyd1bml0SUQnLCAncHJvcGVydHknLCAndmFsdWUnXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cGRhdGVNb2RlbENoYW5nZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0Q2hhbmdlcyhbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnc3RhcnQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXI6IGZ1bmN0aW9uKGJhdHRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5pdCA9IGJhdHRsZS5nZXRVbml0QnlJRChzZWxmLnVuaXRJRCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRbc2VsZi5wcm9wZXJ0eV0gPSBzZWxmLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRpbWUgKyAnbXM6IFNldFVuaXRQcm9wZXJ0eSAoJyArIHRoaXMudW5pdElEICsgJyk6ICcgK1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0eSArICcgPSAnICsgdGhpcy52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBzaC5hY3Rpb25zLkZpbmlzaE9yZGVyID0gc2guQWN0aW9uLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdGaW5pc2hPcmRlcicsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbJ3VuaXRJRCddLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZU1vZGVsQ2hhbmdlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5zZXRDaGFuZ2VzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdzdGFydCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC5vcmRlcnMuc2hpZnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmF0dGxlLmFkZFVuaXRPcmRlcnModW5pdC5tYWtlVW5pdE9yZGVycygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLmFjdGlvbnMuQmVnaW5TaGlwV2VhcG9uQ2hhcmdlID0gc2guQWN0aW9uLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdCZWdpblNoaXBXZWFwb25DaGFyZ2UnLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWyd1bml0SUQnLCAnd2VhcG9uSUQnLCAnY2hhcmdlVGltZSddLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZU1vZGVsQ2hhbmdlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5zZXRDaGFuZ2VzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdzdGFydCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoaXAgPSB1bml0LnNoaXAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWFwb24gPSBzaGlwLmdldEl0ZW1CeUlEKHNlbGYud2VhcG9uSUQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0LmNoYXJnaW5nU2hpcFdlYXBvbiA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlYXBvbklEOiBzZWxmLndlYXBvbklELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdUaW1lOiBzZWxmLnRpbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2VhcG9uLmNoYXJnZWRCeSA9IHVuaXQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IHNlbGYuY2hhcmdlVGltZSxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ2VuZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oKSB7Ly8oYmF0dGxlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2VtcHR5IGZ1bmN0aW9uOiB0aGlzIGNoYW5nZSBpcyBoZXJlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdG8gdHJpZ2dlciBhIGdldEFjdGlvbnMgY2FsbCBmcm9tIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3VuaXQgcmVzcG9uc2libGUgZm9yIGZpcmluZy5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7Ly9mb3IganNMaW50XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBzaC5hY3Rpb25zLkZpcmVTaGlwV2VhcG9uID0gc2guQWN0aW9uLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdGaXJlU2hpcFdlYXBvbicsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbJ3VuaXRJRCcsICd3ZWFwb25JRCcsICd0YXJnZXRJRCddLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZU1vZGVsQ2hhbmdlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5tb2RlbENoYW5nZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5zZXRDaGFuZ2VzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdzdGFydCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC5jYW5jZWxTaGlwV2VhcG9uRmlyZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiA4MDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdoaXQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXI6IGZ1bmN0aW9uKGJhdHRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5pdCA9IGJhdHRsZS5nZXRVbml0QnlJRChzZWxmLnVuaXRJRCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG9vdGVyU2hpcCA9IHVuaXQuc2hpcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhbWFnZWRTaGlwID0gYmF0dGxlLmdldFNoaXBCeUlEKHNlbGYudGFyZ2V0SUQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYW1hZ2VkU2hpcC5ocCAtPSBzaG9vdGVyU2hpcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmdldEl0ZW1CeUlEKHNlbGYud2VhcG9uSUQpLmRhbWFnZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLmFjdGlvbnMuVGVsZXBvcnQgPSBzaC5BY3Rpb24uZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ1RlbGVwb3J0JyxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFsndW5pdElEJywgJ3RhcmdldFNoaXBJRCcsICd0ZWxlcG9ydGVySUQnXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1cGRhdGVNb2RlbENoYW5nZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0Q2hhbmdlcyhbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnc3RhcnQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXI6IGZ1bmN0aW9uKGJhdHRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5pdCA9IGJhdHRsZS5nZXRVbml0QnlJRChzZWxmLnVuaXRJRCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VTaGlwSUQgPSB1bml0LnNoaXAuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRTaGlwID0gYmF0dGxlLmdldFNoaXBCeUlEKHNlbGYudGFyZ2V0U2hpcElEKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC5vcmRlcnMgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmF0dGxlLmFkZFVuaXRPcmRlcnModW5pdC5tYWtlVW5pdE9yZGVycygpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC5zaGlwLnJlbW92ZVVuaXQodW5pdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFNoaXAucHV0VW5pdCh1bml0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC50ZWxlcG9ydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdC50ZWxlcG9ydFNvdXJjZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbGVwb3J0ZXJJRDogc2VsZi50ZWxlcG9ydGVySUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGlwSUQ6IHNvdXJjZVNoaXBJRFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgc2guYWN0aW9ucy5SZWNhbGwgPSBzaC5BY3Rpb24uZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ1JlY2FsbCcsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbJ3VuaXRJRCddLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwZGF0ZU1vZGVsQ2hhbmdlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5zZXRDaGFuZ2VzKFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdzdGFydCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcjogZnVuY3Rpb24oYmF0dGxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHNlbGYudW5pdElEKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVNoaXAgPSBiYXR0bGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0U2hpcEJ5SUQodW5pdC50ZWxlcG9ydFNvdXJjZS5zaGlwSUQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVsZXBvcnRlciA9IHNvdXJjZVNoaXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0SXRlbUJ5SUQodW5pdC50ZWxlcG9ydFNvdXJjZS50ZWxlcG9ydGVySUQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0Lm9yZGVycyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXR0bGUuYWRkVW5pdE9yZGVycyh1bml0Lm1ha2VVbml0T3JkZXJzKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0LnNoaXAucmVtb3ZlVW5pdCh1bml0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlU2hpcC5wdXRVbml0KHVuaXQsIHRlbGVwb3J0ZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0LnRlbGVwb3J0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bml0LnRlbGVwb3J0U291cmNlID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KCkpO1xyXG4iLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSovXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzLFxyXG4gICAgSnNvbmFibGUgPSByZXF1aXJlKCcuL2pzb25hYmxlJykuSnNvbmFibGUsXHJcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLl8sXHJcbiAgICBhY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zJykuYWN0aW9ucyxcclxuICAgIFNoaXAgPSByZXF1aXJlKCcuL3NoaXAnKS5TaGlwLFxyXG4gICAgUGxheWVyID0gcmVxdWlyZSgnLi9wbGF5ZXInKS5QbGF5ZXIsXHJcbiAgICBPcmRlckNvbGxlY3Rpb24gPSByZXF1aXJlKCcuL29yZGVycycpLk9yZGVyQ29sbGVjdGlvbixcclxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKS51dGlscztcclxuXHJcbi8qKlxyXG4gKiBBIGJhdHRsZS5cclxuICovXHJcbnNoLkJhdHRsZSA9IEpzb25hYmxlLmV4dGVuZFNoYXJlZCh7XHJcbiAgICBzaGlwczogW10sXHJcbiAgICBhcmJpdGVyOiB7Ly9hY3RvciB0aGF0IGRlY2xhcmVzIGEgd2lubmVyXHJcbiAgICAgICAgdHlwZTogJ0FyYml0ZXInLFxyXG4gICAgICAgIGdldEFjdGlvbnM6IGZ1bmN0aW9uKHR1cm5UaW1lLCBiYXR0bGUpIHtcclxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgICAgICBpZiAoYmF0dGxlLndpbm5lciAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW107Ly93aW5uZXIgYWxyZWFkeSBkZWNsYXJlZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBzaGlwc0J5U3RhdHVzID0gXy5ncm91cEJ5KGJhdHRsZS5zaGlwcywgZnVuY3Rpb24oc2hpcCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoaXAuaHAgPD0gMCA/ICdkZXN0cm95ZWQnIDogJ2FsaXZlJztcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICB1bml0c0J5UGxheWVyO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNoaXBzQnlTdGF0dXMuZGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hpcHNCeVN0YXR1cy5hbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IGFjdGlvbnMuRGVjbGFyZVdpbm5lcih7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXllcklEOiBzaGlwc0J5U3RhdHVzLmFsaXZlWzBdLm93bmVyLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgfSldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9hbGwgc2hpcHMgZGVzdHJveWVkLi4uIChkcmF3PylcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9Mb3NlIHdoZW4gcGxheWVyIGhhcyBubyB1bml0cyBsZWZ0LlxyXG4gICAgICAgICAgICB1bml0c0J5UGxheWVyID0gXy5jaGFpbihiYXR0bGUuZ2V0VW5pdHMoKSlcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24odSkge3JldHVybiB1LmlzQWxpdmUoKTsgfSlcclxuICAgICAgICAgICAgICAgIC5ncm91cEJ5KCdvd25lcklEJykudmFsdWUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChfLnNpemUodW5pdHNCeVBsYXllcikgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IGFjdGlvbnMuRGVjbGFyZVdpbm5lcih7XHJcbiAgICAgICAgICAgICAgICAgICAgcGxheWVySUQ6IHBhcnNlSW50KF8ua2V5cyh1bml0c0J5UGxheWVyKVswXSwgMTApXHJcbiAgICAgICAgICAgICAgICB9KV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnQmF0dGxlJyxcclxuICAgICAgICAgICAgcHJvcGVydGllczogWydpZCcsICd0dXJuRHVyYXRpb24nLCAnd2lubmVyJ10sXHJcbiAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNoaXBzID0gXy5tYXAoanNvbi5zaGlwcywgZnVuY3Rpb24oc2hpcEpzb24pIHtcclxuICAgICAgICAgICAgdmFyIHNoaXAgPSBuZXcgU2hpcCh7anNvbjogc2hpcEpzb259KTtcclxuICAgICAgICAgICAgc2hpcC5iYXR0bGUgPSB0aGlzO1xyXG4gICAgICAgICAgICByZXR1cm4gc2hpcDtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICB0aGlzLnBsYXllcnMgPSBfLm1hcChqc29uLnBsYXllcnMsIGZ1bmN0aW9uKHBsYXllckpzb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQbGF5ZXIocGxheWVySnNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5wZW5kaW5nQWN0aW9ucyA9IFtdO1xyXG4gICAgICAgIHRoaXMub3JkZXJDb2xsZWN0aW9uID0gbmV3IE9yZGVyQ29sbGVjdGlvbigpO1xyXG4gICAgfSxcclxuICAgIHRvSnNvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBqc29uID0gdGhpcy5wYXJlbnQoKTtcclxuICAgICAgICBqc29uLnNoaXBzID0gdXRpbHMubWFwVG9Kc29uKHRoaXMuc2hpcHMpO1xyXG4gICAgICAgIGpzb24ucGxheWVycyA9IHV0aWxzLm1hcFRvSnNvbih0aGlzLnBsYXllcnMpO1xyXG4gICAgICAgIHJldHVybiBqc29uO1xyXG4gICAgfSxcclxuICAgIGFkZFNoaXA6IGZ1bmN0aW9uKHNoaXApIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgc2hpcC5iYXR0bGUgPSB0aGlzO1xyXG4gICAgICAgIHNoaXAuaWQgPSB0aGlzLnNoaXBzLmxlbmd0aCArIDE7XHJcbiAgICAgICAgdGhpcy5zaGlwcy5wdXNoKHNoaXApO1xyXG4gICAgfSxcclxuICAgIGdldFNoaXBCeUlEOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gXy5maW5kV2hlcmUodGhpcy5zaGlwcywge2lkOiBpZH0pO1xyXG4gICAgfSxcclxuICAgIGdldFBsYXllcnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gXy5wbHVjayh0aGlzLnNoaXBzLCAnb3duZXInKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqQHJldHVybiBBcnJheSBPYmplY3RzIHRoYXQgaGF2ZSB0aGUgLmdldEFjdGlvbnMgbWV0aG9kLlxyXG4gICAgICovXHJcbiAgICBnZXRBY3RvcnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgYWN0b3JzID0gdGhpcy5nZXRVbml0cygpO1xyXG4gICAgICAgIGFjdG9ycyA9IGFjdG9ycy5jb25jYXQoXy5maWx0ZXIodGhpcy5nZXRJdGVtcygpLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmdldEFjdGlvbnMgIT09IHVuZGVmaW5lZDtcclxuICAgICAgICB9KSk7XHJcbiAgICAgICAgYWN0b3JzLnB1c2godGhpcy5hcmJpdGVyKTtcclxuICAgICAgICByZXR1cm4gYWN0b3JzO1xyXG4gICAgfSxcclxuICAgIGdldFVuaXRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIF8uZmxhdHRlbihfLnBsdWNrKHRoaXMuc2hpcHMsICd1bml0cycpKTtcclxuICAgIH0sXHJcbiAgICBnZXRJdGVtczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiBfLmZsYXR0ZW4oXy5wbHVjayh0aGlzLnNoaXBzLCAnYnVpbHQnKSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0VW5pdEJ5SUQ6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlkID0gcGFyc2VJbnQoaWQsIDEwKTtcclxuICAgICAgICByZXR1cm4gXy5maW5kV2hlcmUodGhpcy5nZXRVbml0cygpLCB7aWQ6IGlkfSk7XHJcbiAgICB9LFxyXG4gICAgYXNzaWduVW5pdElEOiBmdW5jdGlvbih1bml0KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB1bml0cyA9IHRoaXMuZ2V0VW5pdHMoKTtcclxuICAgICAgICBpZiAodW5pdHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHVuaXQuaWQgPSAxO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHVuaXQuaWQgPSBfLm1heCh1bml0cywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZS5pZDtcclxuICAgICAgICB9KS5pZCArIDE7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSBvcmRlcnMgZnJvbSBhbGwgdGhlIHVuaXRzIGFzIGFuIHNoLk9yZGVyQ29sbGVjdGlvblxyXG4gICAgICogQHJldHVybiB7c2guT3JkZXJDb2xsZWN0aW9ufVxyXG4gICAgICovXHJcbiAgICBleHRyYWN0T3JkZXJzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXJDb2xsZWN0aW9uO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogRGlzdHJpYnV0ZSB0aGUgb3JkZXJzIGFtb25nIHRoZSB1bml0cy5cclxuICAgICAqIEBwYXJhbSB7c2guT3JkZXJDb2xsZWN0aW9ufSBvcmRlckNvbGxlY3Rpb25cclxuICAgICAqL1xyXG4gICAgaW5zZXJ0T3JkZXJzOiBmdW5jdGlvbihvcmRlckNvbGxlY3Rpb24pIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIF8uZWFjaChvcmRlckNvbGxlY3Rpb24uYWxsVW5pdE9yZGVycywgZnVuY3Rpb24odW5pdE9yZGVycykge1xyXG4gICAgICAgICAgICBzZWxmLmFkZFVuaXRPcmRlcnModW5pdE9yZGVycyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgYWRkVW5pdE9yZGVyczogZnVuY3Rpb24odW5pdE9yZGVycykge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLm9yZGVyQ29sbGVjdGlvbi5hZGRVbml0T3JkZXJzKHVuaXRPcmRlcnMpO1xyXG4gICAgICAgIHRoaXMuZ2V0VW5pdEJ5SUQodW5pdE9yZGVycy51bml0SUQpLm9yZGVycyA9IHVuaXRPcmRlcnMuYXJyYXk7XHJcbiAgICB9LFxyXG4gICAgZW5kT2ZUdXJuUmVzZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBfLmludm9rZSh0aGlzLnNoaXBzLCAnZW5kT2ZUdXJuUmVzZXQnLCB0aGlzLnR1cm5EdXJhdGlvbik7XHJcbiAgICAgICAgLy9yZW1vdmUgb3JkZXJzIGZyb20gZGVhZCB1bml0c1xyXG4gICAgICAgIF8uZWFjaCh0aGlzLm9yZGVyQ29sbGVjdGlvbi5hbGxVbml0T3JkZXJzLCBmdW5jdGlvbih1bml0T3JkZXJzKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5nZXRVbml0QnlJRCh1bml0T3JkZXJzLnVuaXRJRCkpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm9yZGVyQ29sbGVjdGlvbi5hbGxVbml0T3JkZXJzW3VuaXRPcmRlcnMudW5pdElEXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgfSxcclxuICAgIGdldFBsYXllclNoaXBzOiBmdW5jdGlvbihwbGF5ZXJJRCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gXy5maWx0ZXIodGhpcy5zaGlwcywgZnVuY3Rpb24oc2hpcCkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2hpcC5vd25lci5pZCA9PT0gcGxheWVySUQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0RW5lbXlTaGlwczogZnVuY3Rpb24ocGxheWVySUQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHRoaXMuc2hpcHMsIGZ1bmN0aW9uKHNoaXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNoaXAub3duZXIuaWQgIT09IHBsYXllcklEO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCBtZSwgcmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKi9cclxuXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzLFxyXG4gICAgVGlsZUVudGl0eSA9IHJlcXVpcmUoJy4vdGlsZS1lbnRpdHknKS5UaWxlRW50aXR5LFxyXG4gICAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKS5fLFxyXG4gICAgcHIgPSByZXF1aXJlKCcuLi9wbGFjZW1lbnQtcnVsZXMnKS5wcixcclxuICAgIGdlbiA9IHJlcXVpcmUoJy4uL2dlbmVyYWwtc3R1ZmYnKSxcclxuICAgIEdSSURfU1VCID0gZ2VuLkdSSURfU1VCLFxyXG4gICAgdGlsZXMgPSBnZW4udGlsZXM7XHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgY29tcG9uZW50IGZyb20gdGhlIHNoaXAgKEVuZ2luZSwgV2VhcG9uLCBldGMpLlxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLkl0ZW0gPSBUaWxlRW50aXR5LmV4dGVuZFNoYXJlZCh7XHJcbiAgICBzaXplOiBbMSwgMV0sXHJcbiAgICB3YWxrYWJsZTogZmFsc2UsXHJcbiAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdJdGVtJyxcclxuICAgICAgICAgICAgcHJvcGVydGllczogW10sXHJcbiAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAoanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnJvdGF0ZWQoanNvbi5yKTtcclxuICAgICAgICAgICAgdGhpcy5zaGlwID0ganNvbi5zaGlwO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjYW5CdWlsZEF0OiBmdW5jdGlvbih4LCB5LCBzaGlwKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIC8vZGVmYXVsdCBwbGFjZW1lbnQgcnVsZVxyXG4gICAgICAgIHJldHVybiB0aGlzLnBsYWNlbWVudFJ1bGVcclxuICAgICAgICAgICAgLmNvbXBsaWVzQXQoeCwgeSwgc2hpcC5tYXApO1xyXG4gICAgfSxcclxuICAgIGNhbkJ1aWxkUm90YXRlZDogZnVuY3Rpb24oKSB7Ly8oeCwgeSwgc2hpcClcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgLy9kZWZhdWx0IHBsYWNlbWVudCBydWxlXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIF9yb3RhdGVkOiBmYWxzZSxcclxuICAgIHJvdGF0ZWQ6IGZ1bmN0aW9uKHJvdGF0ZWQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKHJvdGF0ZWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm90YXRlZDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcm90YXRlZCA9IHJvdGF0ZWQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgLy90YWtlcyByb3RhdGlvbiBpbnRvIGFjY291bnRcclxuICAgIHRydWVTaXplOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCkgeyAvL2NhbiBwYXNzIGFuIGluZGV4OiAwPSB3aWR0aCwgMT0gaGVpZ2h0XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvdGF0ZWQoKSA/IFt0aGlzLnNpemVbMV0sIHRoaXMuc2l6ZVswXV0gOiB0aGlzLnNpemU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnJvdGF0ZWQoKSkge1xyXG4gICAgICAgICAgICBpbmRleCA9IChpbmRleCA9PT0gMSkgPyAwIDogMTsgLy90b2dnbGVzIDEgYW5kIDBcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZVtpbmRleF07XHJcbiAgICB9LFxyXG5cclxuICAgIG9uQnVpbHQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICAvL2Fic3RyYWN0IG1ldGhvZFxyXG4gICAgICAgIHJldHVybiBudWxsOy8vZm9yIGpzTGludFxyXG4gICAgfSxcclxuICAgIG9uU2hpcDogZnVuY3Rpb24oc2hpcCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAoc2hpcCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNoaXA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2hpcCA9IHNoaXA7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9LFxyXG4gICAgdG9Kc29uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGpzb24gPSB0aGlzLnBhcmVudCgpO1xyXG4gICAgICAgIGpzb24uciA9IHRoaXMucm90YXRlZCgpO1xyXG4gICAgICAgIHJldHVybiBqc29uO1xyXG4gICAgfSxcclxuICAgIHNldFNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5zaXplID0gW3dpZHRoLCBoZWlnaHRdO1xyXG4gICAgICAgIHRoaXMub25TaXplQ2hhbmdlZCgpO1xyXG4gICAgfSxcclxuICAgIG9uU2l6ZUNoYW5nZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBsYWNlbWVudFJ1bGUgPSBwci5tYWtlLnNwYWNlUnVsZSh0aWxlcy5jbGVhcixcclxuICAgICAgICAgICAgdGhpcy5zaXplWzBdLCB0aGlzLnNpemVbMV0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBFbnVtZXJhdGVzIGFsbCB0aGUgY29uY3JldGUgaXRlbSBjb25zdHJ1Y3RvcnMuXHJcbiAqIEB0eXBlIHt7fX1cclxuICovXHJcbnNoLml0ZW1zID0ge307XHJcblxyXG4vKipcclxuICogQSBXZWFwb24uXHJcbiAqIEB0eXBlIHsqfVxyXG4gKi9cclxuc2guaXRlbXMuV2VhcG9uID0gc2guSXRlbS5leHRlbmRTaGFyZWQoe1xyXG4gICAgY2hhcmdlVGltZTogMjUwMCxcclxuICAgIGRhbWFnZTogMTAwLFxyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnV2VhcG9uJyxcclxuICAgICAgICAgICAgcHJvcGVydGllczogW10sXHJcbiAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNldFNpemUoMiAqIEdSSURfU1VCLCAyICogR1JJRF9TVUIpO1xyXG4gICAgfSxcclxuICAgIGNhbkJ1aWxkQXQ6IGZ1bmN0aW9uKHgsIHksIHNoaXApIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIHByLndlYXBvbi5jb21wbGllc0F0KHgsIHksIHNoaXAubWFwKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogQW4gRW5naW5lLlxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLml0ZW1zLkVuZ2luZSA9IHNoLkl0ZW0uZXh0ZW5kU2hhcmVkKHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgdHlwZTogJ0VuZ2luZScsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRTaXplKDIgKiBHUklEX1NVQiwgMiAqIEdSSURfU1VCKTtcclxuICAgIH0sXHJcbiAgICBjYW5CdWlsZEF0OiBmdW5jdGlvbih4LCB5LCBzaGlwKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiBwci5FbmdpbmUuY29tcGxpZXNBdCh4LCB5LCBzaGlwLm1hcCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFBvd2VyIVxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLml0ZW1zLlBvd2VyID0gc2guSXRlbS5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnUG93ZXInLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuc2V0U2l6ZSgyICogR1JJRF9TVUIsIDIgKiBHUklEX1NVQik7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBDb25zb2xlIG5leHQgdG8gdGhlIFBvd2VyLCBXZWFwb24gb3IgRW5naW5lLlxyXG4gKiBBIHVuaXQgbXVzdCBydW4gdGhlc2UgaXRlbXMgZnJvbSB0aGUgY29uc29sZS5cclxuICogQHR5cGUgeyp9XHJcbiAqL1xyXG5zaC5pdGVtcy5Db25zb2xlID0gc2guSXRlbS5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnQ29uc29sZScsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRTaXplKEdSSURfU1VCLCBHUklEX1NVQik7XHJcbiAgICAgICAgdGhpcy53YWxrYWJsZSA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgY2FuQnVpbGRBdDogZnVuY3Rpb24oeCwgeSwgc2hpcCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gcHIuY29uc29sZS5jb21wbGllc0F0KHgsIHksIHNoaXAubWFwKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgaXRlbSB0aGF0IGlzIGNvbnRyb2xsZWQgYnkgdGhpcyBjb25zb2xlLlxyXG4gICAgICogQHJldHVybiB7c2guSXRlbX1cclxuICAgICAqL1xyXG4gICAgZ2V0Q29udHJvbGxlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB4LCB5LCBhdFRpbGU7XHJcbiAgICAgICAgaWYgKHRoaXMuY29udHJvbGxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250cm9sbGVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2Fzc2lnbiBjb250cm9sbGVkICh0aGUgaXRlbSBiZWluZyBjb250cm9sbGVkIGJ5IHRoaXMgY29uc29sZSlcclxuICAgICAgICBmb3IgKHkgPSB0aGlzLnkgKyBHUklEX1NVQjsgeSA+PSB0aGlzLnkgLSBHUklEX1NVQjtcclxuICAgICAgICAgICAgICAgIHkgLT0gR1JJRF9TVUIpIHtcclxuICAgICAgICAgICAgZm9yICh4ID0gdGhpcy54IC0gR1JJRF9TVUI7IHggPD0gdGhpcy54ICsgR1JJRF9TVUI7XHJcbiAgICAgICAgICAgICAgICAgICAgeCArPSBHUklEX1NVQikge1xyXG4gICAgICAgICAgICAgICAgYXRUaWxlID0gdGhpcy5zaGlwLml0ZW1zTWFwLmF0KHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0VGlsZS50eXBlID09PSAnV2VhcG9uJyB8fCBhdFRpbGUudHlwZSA9PT0gJ0VuZ2luZScgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXRUaWxlLnR5cGUgPT09ICdQb3dlcicpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRyb2xsZWQgPSBhdFRpbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udHJvbGxlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogQ29tcG9uZW50LlxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLml0ZW1zLkNvbXBvbmVudCA9IHNoLkl0ZW0uZXh0ZW5kU2hhcmVkKHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgdHlwZTogJ0NvbXBvbmVudCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRTaXplKDIgKiBHUklEX1NVQiwgMiAqIEdSSURfU1VCKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogRG9vci4gQ2FuIGJlIHBsYWNlZCBvbiB0b3Agb2YgYSBXYWxsIG9yIGJldHdlZW4gdHdvIFdhbGxzLlxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLml0ZW1zLkRvb3IgPSBzaC5JdGVtLmV4dGVuZFNoYXJlZCh7XHJcbiAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdEb29yJyxcclxuICAgICAgICAgICAgcHJvcGVydGllczogW10sXHJcbiAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNldFNpemUoMiAqIEdSSURfU1VCLCBHUklEX1NVQik7XHJcbiAgICAgICAgdGhpcy53YWxrYWJsZSA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgY2FuQnVpbGRBdDogZnVuY3Rpb24oeCwgeSwgc2hpcCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gcHIuZG9vci5jb21wbGllc0F0KHgsIHksIHNoaXAubWFwKTtcclxuICAgIH0sXHJcbiAgICBjYW5CdWlsZFJvdGF0ZWQ6IGZ1bmN0aW9uKHgsIHksIHNoaXApIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIHByLmRvb3JSb3RhdGVkLmNvbXBsaWVzQXQoeCwgeSwgc2hpcC5tYXApO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBBbiBpbmRpdmlkdWFsIFdhbGwgdGlsZS5cclxuICogQHR5cGUgeyp9XHJcbiAqL1xyXG5zaC5pdGVtcy5XYWxsID0gc2guSXRlbS5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnV2FsbCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRTaXplKEdSSURfU1VCLCBHUklEX1NVQik7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0ZWQgPSB7XHJcbiAgICAgICAgICAgIHRvcDogZmFsc2UsXHJcbiAgICAgICAgICAgIGxlZnQ6IHRydWUsXHJcbiAgICAgICAgICAgIGJvdHRvbTogZmFsc2UsXHJcbiAgICAgICAgICAgIHJpZ2h0OiB0cnVlXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBjYW5CdWlsZEF0OiBmdW5jdGlvbih4LCB5LCBzaGlwKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudCh4LCB5LCBzaGlwKSB8fFxyXG4gICAgICAgICAgICBzaGlwLmF0KHgsIHkpIGluc3RhbmNlb2Ygc2guaXRlbXMuV2FsbDtcclxuICAgIH0sXHJcbiAgICBvbkJ1aWx0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgICAgIHZhciB0b3AgPSB0aGlzLnNoaXAuYXQodGhpcy54LCB0aGlzLnkgLSBHUklEX1NVQiksXHJcbiAgICAgICAgICAgIGxlZnQgPSB0aGlzLnNoaXAuYXQodGhpcy54IC0gR1JJRF9TVUIsIHRoaXMueSksXHJcbiAgICAgICAgICAgIGJvdCA9IHRoaXMuc2hpcC5hdCh0aGlzLngsIHRoaXMueSArIEdSSURfU1VCKSxcclxuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnNoaXAuYXQodGhpcy54ICsgR1JJRF9TVUIsIHRoaXMueSk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVDb25uZWN0aW9ucyh0b3AsIGxlZnQsIGJvdCwgcmlnaHQpO1xyXG4gICAgfSxcclxuICAgIHVwZGF0ZUNvbm5lY3Rpb25zOiBmdW5jdGlvbih0b3AsIGxlZnQsIGJvdCwgcmlnaHQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgLy9tb2RpZnkgc2VsZiBhbmQgc3Vycm91bmRpbmcgV2FsbHMnIGNvbm5lY3Rpb25zXHJcbiAgICAgICAgdmFyIGl0ID0gc2guaXRlbXMsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLngsXHJcbiAgICAgICAgICAgIHkgPSB0aGlzLnk7XHJcbiAgICAgICAgLy9yZXNldFxyXG4gICAgICAgIHRoaXMuY29ubmVjdGVkLnRvcCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGVkLmxlZnQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNvbm5lY3RlZC5ib3R0b20gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNvbm5lY3RlZC5yaWdodCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAodG9wIGluc3RhbmNlb2YgaXQuV2FsbCkge1xyXG4gICAgICAgICAgICB0b3AuY29ubmVjdGVkLmJvdHRvbSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGVkLnRvcCA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0b3AgaW5zdGFuY2VvZiBpdC5Eb29yICYmIHRvcC5yb3RhdGVkKCkgJiZcclxuICAgICAgICAgICAgICAgIHRvcC55ID09PSB5IC0gMiAqIEdSSURfU1VCKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGVkLnRvcCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChsZWZ0IGluc3RhbmNlb2YgaXQuV2FsbCkge1xyXG4gICAgICAgICAgICBsZWZ0LmNvbm5lY3RlZC5yaWdodCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGVkLmxlZnQgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobGVmdCBpbnN0YW5jZW9mIGl0LkRvb3IgJiYgIWxlZnQucm90YXRlZCgpICYmXHJcbiAgICAgICAgICAgICAgICBsZWZ0LnggPT09IHggLSAyICogR1JJRF9TVUIpIHtcclxuICAgICAgICAgICAgdGhpcy5jb25uZWN0ZWQubGVmdCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChib3QgaW5zdGFuY2VvZiBpdC5XYWxsKSB7XHJcbiAgICAgICAgICAgIGJvdC5jb25uZWN0ZWQudG9wID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5jb25uZWN0ZWQuYm90dG9tID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKGJvdCBpbnN0YW5jZW9mIGl0LkRvb3IgJiYgYm90LnJvdGF0ZWQoKSAmJlxyXG4gICAgICAgICAgICAgICAgYm90LnkgPT09IHkgKyBHUklEX1NVQikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbm5lY3RlZC5ib3R0b20gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmlnaHQgaW5zdGFuY2VvZiBpdC5XYWxsKSB7XHJcbiAgICAgICAgICAgIHJpZ2h0LmNvbm5lY3RlZC5sZWZ0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5jb25uZWN0ZWQucmlnaHQgPSB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocmlnaHQgaW5zdGFuY2VvZiBpdC5Eb29yICYmICFyaWdodC5yb3RhdGVkKCkgJiZcclxuICAgICAgICAgICAgICAgIHJpZ2h0LnggPT09IHggKyBHUklEX1NVQikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbm5lY3RlZC5yaWdodCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGlzSG9yaXpvbnRhbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5jb25uZWN0ZWQudG9wICYmICF0aGlzLmNvbm5lY3RlZC5ib3R0b207XHJcbiAgICAgICAgLy8oYmVjYXVzZSBpdCdzIHRoZSBkZWZhdWx0IHN0YXRlKVxyXG4gICAgfSxcclxuICAgIGlzVmVydGljYWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gIXRoaXMuY29ubmVjdGVkLmxlZnQgJiYgIXRoaXMuY29ubmVjdGVkLnJpZ2h0ICYmXHJcbiAgICAgICAgICAgICh0aGlzLmNvbm5lY3RlZC50b3AgfHwgdGhpcy5jb25uZWN0ZWQuYm90dG9tKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogV2VhayBzcG90LlxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLml0ZW1zLldlYWtTcG90ID0gc2guSXRlbS5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnV2Vha1Nwb3QnLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuc2V0U2l6ZSgyICogR1JJRF9TVUIsIDIgKiBHUklEX1NVQik7XHJcbiAgICAgICAgdGhpcy53YWxrYWJsZSA9IHRydWU7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIFRlbGVwb3J0cyB1bml0cyB0aGF0IGFyZSBzdGFuZGluZyBvbiBpdC5cclxuICogQHR5cGUgeyp9XHJcbiAqL1xyXG5zaC5pdGVtcy5UZWxlcG9ydGVyID0gc2guSXRlbS5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICB0eXBlOiAnVGVsZXBvcnRlcicsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRTaXplKEdSSURfU1VCLCBHUklEX1NVQik7XHJcbiAgICAgICAgdGhpcy53YWxrYWJsZSA9IHRydWU7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBieSB0aGUgc2NyaXB0IGNyZWF0b3IgZXZlcnkgdGltZSBzb21ldGhpbmdcclxuICAgICAqIGNoYW5nZWQuIFRoZSBpdGVtJ3MgcHJvcGVydGllcyBzaG91bGQgbm90IGJlIGNoYW5nZWQgaW4gdGhpcyBtZXRob2Q7XHJcbiAgICAgKiB0aGUgc2NyaXB0IGNyZWF0b3IgZG9lcyB0aGF0IHRocm91Z2ggdGhlIG1vZGVsQ2hhbmdlcyBhcnJheSBmb3VuZCBpblxyXG4gICAgICogZWFjaCBhY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0ge2ludH0gdHVyblRpbWUgVGhlIGN1cnJlbnQgdGltZS5cclxuICAgICAqIEBwYXJhbSB7c2guQmF0dGxlfSBiYXR0bGUgVGhlIGJhdHRsZSwgcmVwcmVzZW50aW5nIHRoZSBlbnRpcmUgbW9kZWxcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBnZXRBY3Rpb25zOiBmdW5jdGlvbih0dXJuVGltZSwgYmF0dGxlKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgYWN0aW9ucyA9IFtdLFxyXG4gICAgICAgICAgICBUZWxlcG9ydCA9IHJlcXVpcmUoJy4vYWN0aW9ucycpLmFjdGlvbnMuVGVsZXBvcnQ7XHJcbiAgICAgICAgdGhpcy50aWxlcyhmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgICAgIF8uZWFjaChzZWxmLnNoaXAudW5pdHNNYXAuYXQoeCwgeSksIGZ1bmN0aW9uKHVuaXQpIHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbnMucHVzaChuZXcgVGVsZXBvcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRJRDogdW5pdC5pZCxcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRTaGlwSUQ6IF8uZmluZChiYXR0bGUuc2hpcHMsIGZ1bmN0aW9uKHNoaXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNoaXAuaWQgIT09IHNlbGYuc2hpcC5pZDtcclxuICAgICAgICAgICAgICAgICAgICB9KS5pZCxcclxuICAgICAgICAgICAgICAgICAgICB0ZWxlcG9ydGVySUQ6IHNlbGYuaWRcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSovXHJcblxyXG52YXIgc2ggPSBtb2R1bGUuZXhwb3J0cyxcclxuICAgIFNoYXJlZENsYXNzID0gcmVxdWlyZSgnLi9zaGFyZWQtY2xhc3MnKS5TaGFyZWRDbGFzcyxcclxuICAgIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJykuXztcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuICAgIHNoLkpzb25hYmxlID0gU2hhcmVkQ2xhc3MuZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBfcHJvcGVydGllczogW10sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogU2V0cyB0aGUgcHJvcGVydGllcyBmb3VuZCBpbiB0aGUganNvbiBwYXJhbSB0byB0aGUgb2JqZWN0LlxyXG4gICAgICAgICAqIFRoaXMgcHJvcGVydGllcyBhcmUgbGF0ZXIgdXNlZCBieSB0b0pzb24gdG8gcmV0dXJuIHRoZSBqc29uIGZvcm1cclxuICAgICAgICAgKiBvZiB0aGUgb2JqZWN0LlxyXG4gICAgICAgICAqIEBwYXJhbSB7e3R5cGU6c3RyaW5nLCBwcm9wZXJ0aWVzOkFycmF5LCBqc29uOk9iamVjdH19IHNldHRpbmdzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2V0SnNvbjogZnVuY3Rpb24gKHNldHRpbmdzKSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gc2V0dGluZ3MudHlwZSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgPSBzZXR0aW5ncy5wcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICAgICAganNvbiA9IHNldHRpbmdzLmpzb247XHJcbiAgICAgICAgICAgIGlmICghanNvbikge1xyXG4gICAgICAgICAgICAgICAganNvbiA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XHJcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXMgPSB0aGlzLl9wcm9wZXJ0aWVzLmNvbmNhdChwcm9wZXJ0aWVzKTtcclxuICAgICAgICAgICAgXy5lYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoanNvbltwXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy93b3JrYXJvdW5kIGZvciBub2RlanMgY29udmVydGluZyBudW1iZXJzIGluIGFcclxuICAgICAgICAgICAgICAgIC8vanNvbiBzdHJpbmcgdG8gc3RyaW5nIHdoZW4gdGhlIGNsaWVudCBzZW5kcyBpdCB0b1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIHNlcnZlci5cclxuICAgICAgICAgICAgICAgIC8vVE9ETzogcmVtb3ZlIHdoZW4gc29ja2V0LmlvIGlzIGltcGxlbWVudGVkIChpZiBpdCBkb2Vzbid0XHJcbiAgICAgICAgICAgICAgICAvLyBoYXZlIHRoaXMgcHJvYmxlbSlcclxuICAgICAgICAgICAgICAgIGlmIChqc29uLl9udW1iZXJzICYmIF8uaXNTdHJpbmcoanNvbltwXSkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgXy5jb250YWlucyhqc29uLl9udW1iZXJzLCBwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcF0gPSBwYXJzZUZsb2F0KGpzb25bcF0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW3BdID0ganNvbltwXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvSnNvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIganNvbiA9IHtcclxuICAgICAgICAgICAgICAgIF9udW1iZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBfLmVhY2godGhpcy5fcHJvcGVydGllcywgZnVuY3Rpb24gKHApIHtcclxuICAgICAgICAgICAgICAgIGpzb25bcF0gPSB0aGlzW3BdO1xyXG4gICAgICAgICAgICAgICAgaWYgKF8uaXNOdW1iZXIodGhpc1twXSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBqc29uLl9udW1iZXJzLnB1c2gocCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgICAgICByZXR1cm4ganNvbjtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSgpKTtcclxuIiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCBtZSwgcmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKi9cclxuXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzLFxyXG4gICAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKS5fLFxyXG4gICAgU2hhcmVkQ2xhc3MgPSByZXF1aXJlKCcuL3NoYXJlZC1jbGFzcycpLlNoYXJlZENsYXNzLFxyXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpLnV0aWxzO1xyXG5cclxuLyoqXHJcbiAqIEFuIEFycmF5MmQuXHJcbiAqIEB0eXBlIHsqfVxyXG4gKi9cclxuc2guTWFwID0gU2hhcmVkQ2xhc3MuZXh0ZW5kU2hhcmVkKHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uKHJhdykge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICAvL2NoZWNrIGNvbnNpc3RlbnQgd2lkdGhcclxuICAgICAgICB2YXIgaSwgd2lkdGg7XHJcbiAgICAgICAgaWYgKCFyYXcpIHtcclxuICAgICAgICAgICAgdGhyb3cgJ3JhdyBwYXJhbWV0ZXIgbWFuZGF0b3J5Lic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpZHRoID0gcmF3WzBdLmxlbmd0aDtcclxuICAgICAgICBmb3IgKGkgPSByYXcubGVuZ3RoIC0gMjsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgaWYgKHJhd1tpXS5sZW5ndGggIT09IHdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAndGhlIHJhdyBtYXAgaGFzIG5vdCBjb25zaXN0ZW50IHdpZHRoJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSByYXcubGVuZ3RoO1xyXG4gICAgICAgIHRoaXMucmF3ID0gcmF3O1xyXG4gICAgfSxcclxuICAgIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHJhdyA9IHRoaXMucmF3O1xyXG4gICAgICAgIHRoaXMudGlsZXMoZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAgICAgICByYXdbeV1beF0gPSAwO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIHNldDogZnVuY3Rpb24oeCwgeSwgdmFsdWUpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNJbkJvdW5kcyh4LCB5KSkge1xyXG4gICAgICAgICAgICB0aGlzLnJhd1t5XVt4XSA9IHZhbHVlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93ICdDYW5ub3Qgc2V0IG1hcCBhdCAnICsgeCArICcsJyArIHkgKyAnOiBvdXQgb2YgYm91bmRzLic7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGF0OiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJhd1t5XSAhPT0gdW5kZWZpbmVkID8gdGhpcy5yYXdbeV1beF0gOiB1bmRlZmluZWQ7XHJcbiAgICB9LFxyXG4gICAgaXNJbkJvdW5kczogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4geCA+PSAwICYmIHggPCB0aGlzLndpZHRoICYmIHkgPj0gMCAmJiB5IDwgdGhpcy5oZWlnaHQ7XHJcbiAgICB9LFxyXG4gICAgdGlsZXM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB5LCB4O1xyXG4gICAgICAgIGZvciAoeSA9IHRoaXMuaGVpZ2h0IC0gMTsgeSA+PSAwOyB5LS0pIHtcclxuICAgICAgICAgICAgZm9yICh4ID0gdGhpcy53aWR0aCAtIDE7IHggPj0gMDsgeC0tKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh4LCB5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIE1ha2VzIHRoZSBtYXAgdHdpY2UgYXMgbGFyZ2UsIHRocmVlIHRpbWVzIGF0IGxhcmdlLCBldGMsIGFjY29yZGluZyB0b1xyXG4gICAgICogdGhlIG11bHRpcGxpZXIuXHJcbiAgICAgKiBAcGFyYW0ge2ludH0gbXVsdGlwbGllclxyXG4gICAgICovXHJcbiAgICBzY2FsZTogZnVuY3Rpb24obXVsdGlwbGllcikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgbmV3TWFwID0gW10sXHJcbiAgICAgICAgICAgIGksXHJcbiAgICAgICAgICAgIGo7XHJcbiAgICAgICAgaWYgKG11bHRpcGxpZXIgPT09IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLnJhdywgZnVuY3Rpb24ocm93LCB5KSB7XHJcbiAgICAgICAgICAgIHkgKj0gbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG11bHRpcGxpZXI7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbmV3TWFwLnB1c2goW10pOy8vYWRkIDxtdWx0aXBsaWVyPiByb3dzIGZvciBlYWNoIHJvd1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF8uZWFjaChyb3csIGZ1bmN0aW9uKHRpbGUsIHgpIHtcclxuICAgICAgICAgICAgICAgIHggKj0gbXVsdGlwbGllcjtcclxuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBtdWx0aXBsaWVyOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbXVsdGlwbGllcjsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld01hcFt5ICsgaV1beCArIGpdID0gdGlsZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMucmF3ID0gbmV3TWFwO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBuZXdNYXBbMF0ubGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gbmV3TWFwLmxlbmd0aDtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogQSBtYXAgb2Ygc2guVGlsZUVudGl0eSAod2hpY2ggaGF2ZSB4IGFuZCB5IHBvc2l0aW9uKVxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLkVudGl0eU1hcCA9IHNoLk1hcC5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgZW50aXR5QXJyYXkpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQodXRpbHMuZ2V0RW1wdHlNYXRyaXgod2lkdGgsIGhlaWdodCwgMCkpO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5lbnRpdGllcyA9IGVudGl0eUFycmF5O1xyXG4gICAgICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcclxuICAgICAgICBfLmVhY2godGhpcy5lbnRpdGllcywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgICAgICBlLnRpbGVzKGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0KHgsIHksIGUpO1xyXG4gICAgICAgICAgICB9LCBzZWxmKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmNoYW5nZWQgPSB0cnVlO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBFYWNoIHRpbGUgaG9sZHMgYW4gYXJyYXkgb2YgZW50aXRpZXMuXHJcbiAqIEB0eXBlIHsqfVxyXG4gKi9cclxuc2guRW50aXR5TWFwM2QgPSBzaC5NYXAuZXh0ZW5kU2hhcmVkKHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGVudGl0eUFycmF5KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMucGFyZW50KHV0aWxzLmdldEVtcHR5TWF0cml4KHdpZHRoLCBoZWlnaHQsIDApKTtcclxuICAgICAgICB0aGlzLmNoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuZW50aXRpZXMgPSBlbnRpdHlBcnJheTtcclxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgfSxcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICB0aGlzLmNsZWFyKCk7XHJcbiAgICAgICAgXy5lYWNoKHRoaXMuZW50aXRpZXMsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgZS50aWxlcyhmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuYXQoeCwgeSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNldCh4LCB5LCBbXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZWxmLmF0KHgsIHkpLnB1c2goZSk7XHJcbiAgICAgICAgICAgIH0sIHNlbGYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY2hhbmdlZCA9IHRydWU7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEEgZ3JvdXAgb2YgbWFwcy4gVGhlIGF0IGZ1bmN0aW9uIHJldHVybnMgdGhlIGxhc3QgbWFwIHRoYXRcclxuICogaGFzIHNvbWV0aGluZyBpbiBwb3NpdGlvbiAocGFyYW1ldGVyKSB0aGF0IGlzIG90aGVyIHRoYW4gMC5cclxuICogQHR5cGUgeyp9XHJcbiAqL1xyXG5zaC5Db21wb3VuZE1hcCA9IHNoLk1hcC5leHRlbmRTaGFyZWQoe1xyXG4gICAgaW5pdDogZnVuY3Rpb24obWFwcykge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAoIW1hcHMpIHtcclxuICAgICAgICAgICAgdGhyb3cgJ21hcHMgcGFyYW1ldGVyIG1hbmRhdG9yeS4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NoZWNrIHNpemVzXHJcbiAgICAgICAgKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgd2lkdGggPSBtYXBzWzBdLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWFwc1swXS5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICBpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbWFwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG1hcHNbaV0ud2lkdGggIT09IHdpZHRoIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcHNbaV0uaGVpZ2h0ICE9PSBoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnTWFwcyBmb3IgQ29tcG91bmQgc2hvdWxkIGJlIHRoZSBzYW1lIHNpemUuJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0oKSk7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IG1hcHNbMF0ud2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBtYXBzWzBdLmhlaWdodDtcclxuICAgICAgICB0aGlzLm1hcHMgPSBtYXBzO1xyXG4gICAgfSxcclxuICAgIGF0OiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBpLCB3aGF0O1xyXG4gICAgICAgIGZvciAoaSA9IHRoaXMubWFwcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB3aGF0ID0gdGhpcy5tYXBzW2ldLmF0KHgsIHkpO1xyXG4gICAgICAgICAgICBpZiAod2hhdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoYXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuIiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCByZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUqL1xyXG52YXIgc2ggPSBtb2R1bGUuZXhwb3J0cyxcclxuICAgIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJykuXyxcclxuICAgIFBGID0gcmVxdWlyZSgncGF0aGZpbmRpbmcnKSxcclxuICAgIFNoYXJlZENsYXNzID0gcmVxdWlyZSgnLi9zaGFyZWQtY2xhc3MnKS5TaGFyZWRDbGFzcyxcclxuICAgIEpzb25hYmxlID0gcmVxdWlyZSgnLi9qc29uYWJsZScpLkpzb25hYmxlLFxyXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpLnV0aWxzLFxyXG4gICAgdiA9IHJlcXVpcmUoJy4uL2dlbmVyYWwtc3R1ZmYnKS52LFxyXG4gICAgYWN0aW9ucyA9IHJlcXVpcmUoJy4vYWN0aW9ucycpLmFjdGlvbnMsXHJcbiAgICBpdGVtcyA9IHJlcXVpcmUoJy4vaXRlbXMnKS5pdGVtcztcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuICAgIHZhciBwYXRoZmluZGVyID0gbmV3IFBGLkFTdGFyRmluZGVyKHtcclxuICAgICAgICAgICAgYWxsb3dEaWFnb25hbDogdHJ1ZSxcclxuICAgICAgICAgICAgZG9udENyb3NzQ29ybmVyczogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIHNoLk9yZGVyQ29sbGVjdGlvbiA9IFNoYXJlZENsYXNzLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLmFsbFVuaXRPcmRlcnMgPSB7fTtcclxuICAgICAgICAgICAgaWYgKGpzb24pIHtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChqc29uLCBmdW5jdGlvbih1bml0T3JkZXJzSnNvbiwgdW5pdElEKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbGxVbml0T3JkZXJzW3VuaXRJRF0gPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgc2guVW5pdE9yZGVycyh1bml0T3JkZXJzSnNvbik7XHJcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWRkcyBhIHVuaXQncyBvcmRlcnMgdG8gdGhlIGNvbGxlY3Rpb24uXHJcbiAgICAgICAgICogQHBhcmFtIHtzaC5Vbml0T3JkZXJzfSB1bml0T3JkZXJzXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgYWRkVW5pdE9yZGVyczogZnVuY3Rpb24odW5pdE9yZGVycykge1xyXG4gICAgICAgICAgICB0aGlzLmFsbFVuaXRPcmRlcnNbdW5pdE9yZGVycy51bml0SURdID0gdW5pdE9yZGVycztcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldFVuaXRPcmRlcnM6IGZ1bmN0aW9uKHVuaXRJRCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hbGxVbml0T3JkZXJzW3VuaXRJRF07XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7c2guT3JkZXJDb2xsZWN0aW9ufSBvcmRlckNvbGxlY3Rpb24gQW5vdGhlciBjb2xsZWN0aW9uLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIG1lcmdlOiBmdW5jdGlvbihvcmRlckNvbGxlY3Rpb24pIHtcclxuICAgICAgICAgICAgXy5lYWNoKG9yZGVyQ29sbGVjdGlvbi5hbGxVbml0T3JkZXJzLCBmdW5jdGlvbihvcmRlcnMpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdldFVuaXRPcmRlcnMob3JkZXJzLnVuaXRJRCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnVGhlIGNvbGxlY3Rpb24gYWxyZWFkeSBoYWQgb3JkZXJzIGZvciB1bml0ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmRlcnMudW5pdElEO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRVbml0T3JkZXJzKG9yZGVycyk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IHNoLk9yZGVyQ29sbGVjdGlvbih0aGlzLnRvSnNvbigpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvSnNvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBqc29uID0ge307XHJcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmFsbFVuaXRPcmRlcnMsIGZ1bmN0aW9uKHVuaXRPcmRlcnMsIHVuaXRJRCkge1xyXG4gICAgICAgICAgICAgICAganNvblt1bml0SURdID0gdW5pdE9yZGVycy50b0pzb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBqc29uO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLlVuaXRPcmRlcnMgPSBTaGFyZWRDbGFzcy5leHRlbmRTaGFyZWQoe1xyXG4gICAgICAgIHR5cGU6ICdVbml0T3JkZXJzJyxcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMudW5pdElEID0gcGFyc2VJbnQoanNvbi51bml0SUQsIDEwKTtcclxuICAgICAgICAgICAgdGhpcy5hcnJheSA9IHV0aWxzLm1hcEZyb21Kc29uKGpzb24uYXJyYXksIHNoLm9yZGVycyk7XHJcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdGUodGhpcy51bml0SUQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uKHVuaXRJRCkge1xyXG4gICAgICAgICAgICBpZiAoXy5hbnkodGhpcy5hcnJheSwgZnVuY3Rpb24ob3JkZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3JkZXIudW5pdElEICE9PSB1bml0SUQ7XHJcbiAgICAgICAgICAgICAgICB9KSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RoZXJlIGFyZSBvcmRlcnMgdGhhdCBkb25cXCd0IGJlbG9uZyB0byB0aGUgdW5pdCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGFkZDogZnVuY3Rpb24ob3JkZXIpIHtcclxuICAgICAgICAgICAgaWYgKG9yZGVyLnVuaXRJRCAhPT0gdGhpcy51bml0SUQpIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdUaGUgb3JkZXIgZG9lcyBub3QgYmVsb25nIHRvIHRoZSB1bml0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFycmF5LnB1c2gob3JkZXIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdG9Kc29uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcclxuICAgICAgICAgICAgICAgIHVuaXRJRDogdGhpcy51bml0SUQsXHJcbiAgICAgICAgICAgICAgICBhcnJheTogdXRpbHMubWFwVG9Kc29uKHRoaXMuYXJyYXkpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgc2guT3JkZXIgPSBKc29uYWJsZS5leHRlbmRTaGFyZWQoe1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdPcmRlcicsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbJ3VuaXRJRCddLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGlzVmFsaWQ6IGZ1bmN0aW9uKGJhdHRsZSwgcGxheWVySUQpIHtcclxuICAgICAgICAgICAgdmFyIHVuaXQgPSBiYXR0bGUuZ2V0VW5pdEJ5SUQodGhpcy51bml0SUQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdW5pdCAmJiB1bml0Lm93bmVySUQgPT09IHBsYXllcklEO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIHRpbGVJc0NsZWFyKHRpbWUsIHNoaXAsIHVuaXQsIHRpbGUpIHtcclxuICAgICAgICB2YXIgdW5pdHMgPSBzaGlwLnVuaXRzTWFwLmF0KHRpbGUueCwgdGlsZS55KSxcclxuICAgICAgICAgICAgYXJyaXZhbFRpbWUgPSB0aW1lICsgdW5pdC5nZXRUaW1lRm9yTW92aW5nKHVuaXQsIHRpbGUsIHNoaXApO1xyXG4gICAgICAgIHJldHVybiAoIXVuaXRzIHx8Ly90aGVyZSdzIG5vIHVuaXQgYWhlYWRcclxuICAgICAgICAgICAgXy5hbGwodW5pdHMsIGZ1bmN0aW9uKHUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAhdS5pc0FsaXZlKCkgfHwvL29yIHRoZXkncmUgZWl0aGVyIGRlYWQuLi5cclxuICAgICAgICAgICAgICAgICAgICAodS5tb3ZpbmcgJiYgLy8uLi5vciB0aGV5J3JlIGdvaW5nIGF3YXlcclxuICAgICAgICAgICAgICAgICAgICAhdi5lcXVhbCh1Lm1vdmluZy5kZXN0LCB0aWxlKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHUubW92aW5nLmFycml2YWxUaW1lIDw9IGFycml2YWxUaW1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSkpICYmXHJcblxyXG4gICAgICAgICAgICAhXy5hbnkoc2hpcC51bml0cyxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHUpIHtcclxuICAgICAgICAgICAgICAgICAgICAvL25vIHVuaXQgaXMgbW92aW5nIHRoZXJlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHUuaWQgIT09IHVuaXQuaWQgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgdS5tb3ZpbmcgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgdi5lcXVhbCh1Lm1vdmluZy5kZXN0LCB0aWxlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNoLm9yZGVycyA9IHt9O1xyXG5cclxuICAgIC8vQWJzdHJhY3QgY2xhc3NcclxuICAgIHNoLm9yZGVycy5Hb1RvID0gc2guT3JkZXIuZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ29UbzogZnVuY3Rpb24ocG9zLCBiYXR0bGUpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgdW5pdCA9IGJhdHRsZS5nZXRVbml0QnlJRCh0aGlzLnVuaXRJRCksXHJcbiAgICAgICAgICAgICAgICBzaGlwID0gdW5pdC5zaGlwO1xyXG4gICAgICAgICAgICB0aGlzLmdvVG9TdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRvOiBwb3MsXHJcbiAgICAgICAgICAgICAgICBhcnJpdmVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHBhdGg6IHNlbGYuZ2V0UGF0aCh1bml0LCBwb3MsIHNoaXApLFxyXG4gICAgICAgICAgICAgICAgcGF0aEluZGV4OiAxXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRQYXRoOiBmdW5jdGlvbihmcm9tLCB0bywgc2hpcCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZ3JpZEZvclBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZEZvclBhdGggPSBuZXcgUEYuR3JpZChzaGlwLndpZHRoLCBzaGlwLmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICBzaGlwLmdldFBmTWF0cml4KCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwYXRoZmluZGVyLmZpbmRQYXRoKGZyb20ueCwgZnJvbS55LCB0by54LCB0by55LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkRm9yUGF0aC5jbG9uZSgpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldE1vdmVBY3Rpb246IGZ1bmN0aW9uKHRpbWUsIGJhdHRsZSkge1xyXG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLmdvVG9TdGF0ZSxcclxuICAgICAgICAgICAgICAgIHVuaXQsXHJcbiAgICAgICAgICAgICAgICBzaGlwLFxyXG4gICAgICAgICAgICAgICAgbmV4dFRpbGUsXHJcbiAgICAgICAgICAgICAgICBmcm9tO1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgIXN0YXRlLmFycml2ZWQpIHtcclxuICAgICAgICAgICAgICAgIHVuaXQgPSBiYXR0bGUuZ2V0VW5pdEJ5SUQodGhpcy51bml0SUQpO1xyXG4gICAgICAgICAgICAgICAgc2hpcCA9IHVuaXQuc2hpcDtcclxuICAgICAgICAgICAgICAgIGlmICh2LmVxdWFsKHVuaXQsIHN0YXRlLnRvKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vdW5pdCBpcyBhbHJlYWR5IGF0IGRlc3RpbmF0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuYXJyaXZlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodW5pdC5tb3ZpbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghc3RhdGUucGF0aCB8fCBzdGF0ZS5wYXRoSW5kZXggPj0gc3RhdGUucGF0aC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdvVG9TdGF0ZS5hcnJpdmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIG5leHRUaWxlID0ge3g6IHN0YXRlLnBhdGhbc3RhdGUucGF0aEluZGV4XVswXSxcclxuICAgICAgICAgICAgICAgICAgICB5OiBzdGF0ZS5wYXRoW3N0YXRlLnBhdGhJbmRleF1bMV19O1xyXG4gICAgICAgICAgICAgICAgaWYgKHRpbGVJc0NsZWFyKHRpbWUsIHNoaXAsIHVuaXQsIG5leHRUaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyb20gPSB7eDogdW5pdC54LCB5OiB1bml0Lnl9O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnBhdGhJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgYWN0aW9ucy5Nb3ZlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdElEOiB1bml0LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiBmcm9tLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogbmV4dFRpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB1bml0LmdldFRpbWVGb3JNb3ZpbmcoZnJvbSwgbmV4dFRpbGUsIHNoaXApXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHNoLm9yZGVycy5Nb3ZlID0gc2gub3JkZXJzLkdvVG8uZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICAvL2luIGNhc2UgaXRzIGEgbWUuVmVjdG9yMkRcclxuICAgICAgICAgICAganNvbi5kZXN0aW5hdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KGpzb24uZGVzdGluYXRpb24ueCwgMTApLFxyXG4gICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoanNvbi5kZXN0aW5hdGlvbi55LCAxMClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdNb3ZlJyxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFsnZGVzdGluYXRpb24nXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBhY3Rpb25zIGZvciB0aGUgdW5pdCB0byBkbyB3aGlsZSB0aGUgb3JkZXIgaXMgdGhlXHJcbiAgICAgICAgICogYWN0aXZlIG9uZS5cclxuICAgICAgICAgKiBAcGFyYW0ge2ludH0gdGltZVxyXG4gICAgICAgICAqIEBwYXJhbSB7c2guQmF0dGxlfSBiYXR0bGVcclxuICAgICAgICAgKiBAcmV0dXJuIHtBcnJheX1cclxuICAgICAgICAgKi9cclxuICAgICAgICBnZXRBY3Rpb25zOiBmdW5jdGlvbih0aW1lLCBiYXR0bGUpIHtcclxuICAgICAgICAgICAgdmFyIG1vdmU7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5nb1RvU3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ29Ubyh0aGlzLmRlc3RpbmF0aW9uLCBiYXR0bGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5nb1RvU3RhdGUuYXJyaXZlZCkge1xyXG4gICAgICAgICAgICAgICAgbW92ZSA9IHRoaXMuZ2V0TW92ZUFjdGlvbih0aW1lLCBiYXR0bGUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vdmUgPyBbbW92ZV0gOiBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gW25ldyBhY3Rpb25zLkZpbmlzaE9yZGVyKHtcclxuICAgICAgICAgICAgICAgIHVuaXRJRDogdGhpcy51bml0SURcclxuICAgICAgICAgICAgfSldO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ01vdmUgdG8gJyArIHYuc3RyKHRoaXMuZGVzdGluYXRpb24pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNWYWxpZDogZnVuY3Rpb24oYmF0dGxlLCBwbGF5ZXJJRCkge1xyXG4gICAgICAgICAgICB2YXIgc2hpcCA9IGJhdHRsZS5nZXRVbml0QnlJRCh0aGlzLnVuaXRJRCkuc2hpcDtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50KGJhdHRsZSwgcGxheWVySUQpICYmXHJcbiAgICAgICAgICAgICAgICBzaGlwLmlzV2Fsa2FibGUodGhpcy5kZXN0aW5hdGlvbi54LCB0aGlzLmRlc3RpbmF0aW9uLnkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLm9yZGVycy5Nb3ZlVG9Db25zb2xlID0gc2gub3JkZXJzLk1vdmUuZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ01vdmVUb0NvbnNvbGUnLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogW10sXHJcbiAgICAgICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ01vdmUgdG8gQ29uc29sZSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc1ZhbGlkOiBmdW5jdGlvbihiYXR0bGUsIHBsYXllcklEKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGlwID0gYmF0dGxlLmdldFVuaXRCeUlEKHRoaXMudW5pdElEKS5zaGlwO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQoYmF0dGxlLCBwbGF5ZXJJRCkgJiZcclxuICAgICAgICAgICAgICAgIHNoaXAuaXRlbXNNYXAuYXQodGhpcy5kZXN0aW5hdGlvbi54LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24ueSkgaW5zdGFuY2VvZiBpdGVtcy5Db25zb2xlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLm9yZGVycy5TZWVrQW5kRGVzdHJveSA9IHNoLm9yZGVycy5Hb1RvLmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudChqc29uKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdTZWVrQW5kRGVzdHJveScsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbJ3RhcmdldElEJ10sXHJcbiAgICAgICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZ2V0QWN0aW9uczogZnVuY3Rpb24odGltZSwgYmF0dGxlKSB7XHJcbiAgICAgICAgICAgIHZhciB1bml0LCB0YXJnZXQsIG1vdmU7XHJcbiAgICAgICAgICAgIHVuaXQgPSBiYXR0bGUuZ2V0VW5pdEJ5SUQodGhpcy51bml0SUQpO1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBiYXR0bGUuZ2V0VW5pdEJ5SUQodGhpcy50YXJnZXRJRCk7XHJcbiAgICAgICAgICAgIGlmICghdGFyZ2V0IHx8ICF0YXJnZXQuaXNBbGl2ZSgpIHx8IHVuaXQuc2hpcCAhPT0gdGFyZ2V0LnNoaXApIHtcclxuICAgICAgICAgICAgICAgIC8vdW5pdCBpcyBhbHJlYWR5IGRlYWRcclxuICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IGFjdGlvbnMuU2V0VW5pdFByb3BlcnR5KHtcclxuICAgICAgICAgICAgICAgICAgICB1bml0SUQ6IHVuaXQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHk6ICd0YXJnZXRJRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBhY3Rpb25zLkZpbmlzaE9yZGVyKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdElEOiB1bml0LmlkXHJcbiAgICAgICAgICAgICAgICAgICAgfSldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh1bml0LnRhcmdldElEID09PSBudWxsIHx8IHVuaXQudGFyZ2V0SUQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtuZXcgYWN0aW9ucy5TZXRVbml0UHJvcGVydHkoe1xyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRJRDogdW5pdC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eTogJ3RhcmdldElEJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdGFyZ2V0LmlkXHJcbiAgICAgICAgICAgICAgICB9KV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHVuaXQubW92aW5nKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHVuaXQuaXNJblJhbmdlKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZ29Ub1N0YXRlIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoT3V0T2ZUYXJnZXQodGhpcy5nb1RvU3RhdGUucGF0aCwgdGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nb1RvKHRhcmdldCwgYmF0dGxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtb3ZlID0gdGhpcy5nZXRNb3ZlQWN0aW9uKHRpbWUsIGJhdHRsZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBtb3ZlID8gW21vdmVdIDogW107XHJcbiAgICAgICAgfSxcclxuICAgICAgICBwYXRoT3V0T2ZUYXJnZXQ6IGZ1bmN0aW9uKHBhdGgsIHRhcmdldCkge1xyXG4gICAgICAgICAgICB2YXIgcGF0aExhc3QgPSBfLmxhc3QocGF0aCk7XHJcbiAgICAgICAgICAgIHBhdGhMYXN0ID0ge3g6IHBhdGhMYXN0WzBdLCB5OiBwYXRoTGFzdFsxXX07XHJcbiAgICAgICAgICAgIHJldHVybiAhdi5lcXVhbChwYXRoTGFzdCwgdGFyZ2V0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdTZWVrICYgRGVzdHJveSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc1ZhbGlkOiBmdW5jdGlvbihiYXR0bGUsIHBsYXllcklEKSB7XHJcbiAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHRoaXMudW5pdElEKSxcclxuICAgICAgICAgICAgICAgIHRhcmdldCA9IGJhdHRsZS5nZXRVbml0QnlJRCh0aGlzLnRhcmdldElEKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50KGJhdHRsZSwgcGxheWVySUQpICYmXHJcbiAgICAgICAgICAgICAgICB0YXJnZXQgJiZcclxuICAgICAgICAgICAgICAgIHRhcmdldC5pc0FsaXZlKCkgJiZcclxuICAgICAgICAgICAgICAgIHVuaXQuaXNFbmVteSh0YXJnZXQpICYmXHJcbiAgICAgICAgICAgICAgICB1bml0LnNoaXAgPT09IHRhcmdldC5zaGlwO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHNoLm9yZGVycy5SZWNhbGwgPSBzaC5PcmRlci5leHRlbmRTaGFyZWQoe1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnUmVjYWxsJyxcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGdldEFjdGlvbnM6IGZ1bmN0aW9uKCkgey8vKHR1cm5UaW1lLCBiYXR0bGUpXHJcbiAgICAgICAgICAgIHJldHVybiBbbmV3IGFjdGlvbnMuUmVjYWxsKHtcclxuICAgICAgICAgICAgICAgIHVuaXRJRDogdGhpcy51bml0SURcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICBuZXcgYWN0aW9ucy5GaW5pc2hPcmRlcih7XHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdElEOiB0aGlzLnVuaXRJRFxyXG4gICAgICAgICAgICAgICAgfSldO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ1JlY2FsbCc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpc1ZhbGlkOiBmdW5jdGlvbihiYXR0bGUsIHBsYXllcklEKSB7XHJcbiAgICAgICAgICAgIHZhciB1bml0ID0gYmF0dGxlLmdldFVuaXRCeUlEKHRoaXMudW5pdElEKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50KGJhdHRsZSwgcGxheWVySUQpICYmXHJcbiAgICAgICAgICAgICAgICB1bml0LnRlbGVwb3J0U291cmNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KCkpO1xyXG4iLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSwgeHl6Ki9cclxuXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzLFxyXG4gICAgSnNvbmFibGUgPSByZXF1aXJlKCcuL2pzb25hYmxlJykuSnNvbmFibGU7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICBzaC5QbGF5ZXIgPSBKc29uYWJsZS5leHRlbmRTaGFyZWQoe1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRKc29uKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdQbGF5ZXInLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogWydpZCcsICduYW1lJywgJ3N0YXRlJ10sXHJcbiAgICAgICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59KCkpO1xyXG4iLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIG1lLCByZXF1aXJlLCBtb2R1bGUsIGV4cG9ydHMqL1xyXG5cclxudmFyIHNoID0gbW9kdWxlLmV4cG9ydHMsXHJcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLl8sXHJcbiAgICBTaGFyZWRDbGFzcyA9IHJlcXVpcmUoJy4vc2hhcmVkLWNsYXNzJykuU2hhcmVkQ2xhc3MsXHJcbiAgICB1dGlscyA9IHJlcXVpcmUoJy4uL3V0aWxzJykudXRpbHMsXHJcbiAgICBhY3Rpb25zID0gcmVxdWlyZSgnLi9hY3Rpb25zJykuYWN0aW9ucztcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuICAgIC8qKlxyXG4gICAgICogQSBjb2xsZWN0aW9uIG9mIEFjdGlvbnMuXHJcbiAgICAgKiBAdHlwZSB7Kn1cclxuICAgICAqL1xyXG4gICAgc2guU2NyaXB0ID0gU2hhcmVkQ2xhc3MuZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICB0dXJuRHVyYXRpb246IDAsXHJcbiAgICAgICAgYWN0aW9uczogW10sXHJcbiAgICAgICAgc29ydGVkTW9kZWxDaGFuZ2VzSW5kZXg6IFtdLFxyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKHBhcmFtZXRlcnMpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmFtZXRlcnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9ucyA9IHBhcmFtZXRlcnMuYWN0aW9ucztcclxuICAgICAgICAgICAgICAgIHRoaXMudHVybkR1cmF0aW9uID0gcGFyYW1ldGVycy50dXJuRHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvcnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNvcnRlZE1vZGVsQ2hhbmdlc0luZGV4ID0gW107XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmcm9tSnNvbjogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICAvL2xvZ2ljIGhlcmVcclxuICAgICAgICAgICAgdGhpcy50dXJuRHVyYXRpb24gPSBqc29uLnR1cm5EdXJhdGlvbjtcclxuICAgICAgICAgICAgdGhpcy5hY3Rpb25zID0gdXRpbHMubWFwRnJvbUpzb24oanNvbi5hY3Rpb25zLCBhY3Rpb25zKTtcclxuICAgICAgICAgICAgXy5pbnZva2UodGhpcy5hY3Rpb25zLCAndXBkYXRlTW9kZWxDaGFuZ2VzJyk7XHJcbiAgICAgICAgICAgIHRoaXMuc29ydGVkTW9kZWxDaGFuZ2VzSW5kZXggPSBqc29uLnNvcnRlZE1vZGVsQ2hhbmdlc0luZGV4O1xyXG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdBY3Rpb25zSnNvbiA9IGpzb24ucGVuZGluZ0FjdGlvbnNKc29uO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvSnNvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnU2NyaXB0JyxcclxuICAgICAgICAgICAgICAgIHR1cm5EdXJhdGlvbjogdGhpcy50dXJuRHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiB1dGlscy5tYXBUb0pzb24odGhpcy5hY3Rpb25zKSxcclxuICAgICAgICAgICAgICAgIHNvcnRlZE1vZGVsQ2hhbmdlc0luZGV4OiB0aGlzLnNvcnRlZE1vZGVsQ2hhbmdlc0luZGV4LFxyXG4gICAgICAgICAgICAgICAgcGVuZGluZ0FjdGlvbnNKc29uOiB0aGlzLnBlbmRpbmdBY3Rpb25zSnNvblxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaXNXaXRoaW5UdXJuOiBmdW5jdGlvbihhY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFjdGlvbi50aW1lIDwgdGhpcy50dXJuRHVyYXRpb24gJiYgYWN0aW9uLnRpbWUgPj0gMDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNvcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMgPSBfLnNvcnRCeSh0aGlzLmFjdGlvbnMsICd0aW1lJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBJbnNlcnRzIGFuIGFjdGlvbiBtYWludGFpbmluZyB0aGVpciBvcmRlclxyXG4gICAgICAgICAqIEBwYXJhbSB7QWN0aW9ufSBhY3Rpb24gVGhlIGFjdGlvbiB0byBiZSBpbnNlcnRlZC5cclxuICAgICAgICAgKiBAcmV0dXJuIHtpbnR9IHRoZSBpbmRleCBvZiB0aGUgYWN0aW9uLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGluc2VydEFjdGlvbjogZnVuY3Rpb24oYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBpbnNlcnRpb25JbmRleCA9IF8uc29ydGVkSW5kZXgodGhpcy5hY3Rpb25zLCBhY3Rpb24sICd0aW1lJyk7XHJcbiAgICAgICAgICAgIC8vYWZ0ZXIgYWN0aW9ucyBvZiB0aGUgc2FtZSB0aW1lXHJcbiAgICAgICAgICAgIHdoaWxlICh0aGlzLmFjdGlvbnNbaW5zZXJ0aW9uSW5kZXhdICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zW2luc2VydGlvbkluZGV4XS50aW1lID09PSBhY3Rpb24udGltZSkge1xyXG4gICAgICAgICAgICAgICAgaW5zZXJ0aW9uSW5kZXgrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGlvbnMuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCBhY3Rpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5zZXJ0aW9uSW5kZXg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBGaWx0ZXIgdGhlIGFjdGlvbnMgYnkgdHlwZSAoU3RyaW5nKS5cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGJ5VHlwZTogZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXy5maWx0ZXIodGhpcy5hY3Rpb25zLCBmdW5jdGlvbihhKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYS50eXBlID09PSB0eXBlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlZ2lzdGVyQ2hhbmdlOiBmdW5jdGlvbihtb2RlbENoYW5nZSkge1xyXG4gICAgICAgICAgICBpZiAobW9kZWxDaGFuZ2UuYWN0aW9uSW5kZXggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc29ydGVkTW9kZWxDaGFuZ2VzSW5kZXgucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb25JbmRleDogbW9kZWxDaGFuZ2UuYWN0aW9uSW5kZXgsXHJcbiAgICAgICAgICAgICAgICBpbmRleDogbW9kZWxDaGFuZ2UuaW5kZXhcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBtb2RlbCBjaGFuZ2VzIGluIHRoZSBvcmRlciBpbiB3aGljaCB0aGV5XHJcbiAgICAgICAgICogd2VyZSByZWdpc3RlcmVkIGJ5IHJlZ2lzdGVyQ2hhbmdlLlxyXG4gICAgICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGdldFNvcnRlZE1vZGVsQ2hhbmdlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLm1hcCh0aGlzLnNvcnRlZE1vZGVsQ2hhbmdlc0luZGV4LCBmdW5jdGlvbihpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hY3Rpb25zW2kuYWN0aW9uSW5kZXhdLm1vZGVsQ2hhbmdlc1tpLmluZGV4XTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn0oKSk7XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCB4eXoqL1xyXG5cclxudmFyIHNoID0gbW9kdWxlLmV4cG9ydHM7XHJcblxyXG4oZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICB2YXIgaW5pdGlhbGl6aW5nID0gZmFsc2UsIC8vZm9yIFNoYXJlZENsYXNzXHJcbiAgICAgICAgZm5UZXN0ID0gL3h5ei8udGVzdChmdW5jdGlvbigpIHt4eXo7fSkgPyAvXFxicGFyZW50XFxiLyA6IC8uKi87XHJcbiAgICAvKipcclxuICAgICAqIEphdmFTY3JpcHQgSW5oZXJpdGFuY2UgSGVscGVyXHJcbiAgICAgKiAodGhlIHNhbWUgYXMgaW4gbWVsb25KUylcclxuICAgICAqICovXHJcbiAgICBzaC5TaGFyZWRDbGFzcyA9IGZ1bmN0aW9uKCkge307XHJcbiAgICBzaC5TaGFyZWRDbGFzcy5leHRlbmRTaGFyZWQgPSBmdW5jdGlvbihwcm9wKSB7XHJcbiAgICAgICAgLy8gX3N1cGVyIHJlbmFtZSB0byBwYXJlbnQgdG8gZWFzZSBjb2RlIHJlYWRpbmdcclxuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wcm90b3R5cGUsXHJcbiAgICAgICAgICAgIHByb3RvLFxyXG4gICAgICAgICAgICBuYW1lO1xyXG5cclxuICAgICAgICAvLyBJbnN0YW50aWF0ZSBhIGJhc2UgY2xhc3MgKGJ1dCBvbmx5IGNyZWF0ZSB0aGUgaW5zdGFuY2UsXHJcbiAgICAgICAgLy8gZG9uJ3QgcnVuIHRoZSBpbml0IGNvbnN0cnVjdG9yKVxyXG4gICAgICAgIGluaXRpYWxpemluZyA9IHRydWU7XHJcbiAgICAgICAgcHJvdG8gPSBuZXcgdGhpcygpO1xyXG4gICAgICAgIGluaXRpYWxpemluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBDb3B5IHRoZSBwcm9wZXJ0aWVzIG92ZXIgb250byB0aGUgbmV3IHByb3RvdHlwZVxyXG4gICAgICAgIGZvciAobmFtZSBpbiBwcm9wKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHdlJ3JlIG92ZXJ3cml0aW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHByb3RvW25hbWVdID0gdHlwZW9mIHByb3BbbmFtZV0gPT09ICdmdW5jdGlvbicgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiBwYXJlbnRbbmFtZV0gPT09ICdmdW5jdGlvbicgJiZcclxuICAgICAgICAgICAgICAgIGZuVGVzdC50ZXN0KHByb3BbbmFtZV0pID8gKGZ1bmN0aW9uKG5hbWUsIGZuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5wYXJlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgYSBuZXcgLl9zdXBlcigpIG1ldGhvZCB0aGF0IGlzIHRoZSBzYW1lIG1ldGhvZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBidXQgb24gdGhlIHN1cGVyLWNsYXNzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50W25hbWVdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlIG1ldGhvZCBvbmx5IG5lZWQgdG8gYmUgYm91bmQgdGVtcG9yYXJpbHksIHNvIHdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBpdCB3aGVuIHdlJ3JlIGRvbmUgZXhlY3V0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldCA9IGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gdG1wO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfShuYW1lLCBwcm9wW25hbWVdKSkgOiBwcm9wW25hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVGhlIGR1bW15IGNsYXNzIGNvbnN0cnVjdG9yXHJcbiAgICAgICAgZnVuY3Rpb24gQ2xhc3MoKSB7XHJcbiAgICAgICAgICAgIGlmICghaW5pdGlhbGl6aW5nICYmIHRoaXMuaW5pdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9yZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gUG9wdWxhdGUgb3VyIGNvbnN0cnVjdGVkIHByb3RvdHlwZSBvYmplY3RcclxuICAgICAgICBDbGFzcy5wcm90b3R5cGUgPSBwcm90bztcclxuICAgICAgICAvLyBFbmZvcmNlIHRoZSBjb25zdHJ1Y3RvciB0byBiZSB3aGF0IHdlIGV4cGVjdFxyXG4gICAgICAgIENsYXNzLmNvbnN0cnVjdG9yID0gQ2xhc3M7XHJcbiAgICAgICAgLy8gQW5kIG1ha2UgdGhpcyBjbGFzcyBleHRlbmRhYmxlXHJcbiAgICAgICAgQ2xhc3MuZXh0ZW5kU2hhcmVkID0gc2guU2hhcmVkQ2xhc3MuZXh0ZW5kU2hhcmVkOy8vYXJndW1lbnRzLmNhbGxlZTtcclxuICAgICAgICBDbGFzcy5leHRlbmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdcImV4dGVuZFNoYXJlZFwiIHNob3VsZCBiZSBjYWxsZWQgaW5zdGVhZCBvZicgK1xyXG4gICAgICAgICAgICAgICAgJyBcImV4dGVuZFwiIG9uIGEgc2hhcmVkIGVudGl0eS4nKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBDbGFzcztcclxuICAgIH07XHJcblxyXG4gICAgc2guVGVzdFNoYXJlZEVudGl0eSA9IHNoLlNoYXJlZENsYXNzLmV4dGVuZFNoYXJlZCh7fSk7XHJcbn0oKSk7XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlLCBodWxsTWFwcyovXHJcblxyXG52YXIgc2ggPSBtb2R1bGUuZXhwb3J0cyxcclxuICAgIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJykuXyxcclxuICAgIFNoYXJlZENsYXNzID0gcmVxdWlyZSgnLi9zaGFyZWQtY2xhc3MnKS5TaGFyZWRDbGFzcyxcclxuICAgIG1hcHMgPSByZXF1aXJlKCcuL21hcCcpLFxyXG4gICAgZ2VuID0gcmVxdWlyZSgnLi4vZ2VuZXJhbC1zdHVmZicpLFxyXG4gICAgR1JJRF9TVUIgPSBnZW4uR1JJRF9TVUIsXHJcbiAgICB0aWxlcyA9IGdlbi50aWxlcyxcclxuICAgIGl0ZW1zID0gcmVxdWlyZSgnLi9pdGVtcycpLml0ZW1zLFxyXG4gICAgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpLnV0aWxzLFxyXG4gICAgUGxheWVyID0gcmVxdWlyZSgnLi9wbGF5ZXInKS5QbGF5ZXIsXHJcbiAgICBVbml0ID0gcmVxdWlyZSgnLi91bml0cycpLlVuaXQsXHJcbiAgICB1bml0cyA9IHJlcXVpcmUoJy4vdW5pdHMnKS51bml0cyxcclxuICAgIEl0ZW0gPSByZXF1aXJlKCcuL2l0ZW1zJykuSXRlbSxcclxuICAgIG9yZGVycyA9IHJlcXVpcmUoJy4vb3JkZXJzJykub3JkZXJzO1xyXG5cclxuLyoqXHJcbiAqIEEgc2hpcC5cclxuICogQHR5cGUgeyp9XHJcbiAqL1xyXG5zaC5TaGlwID0gU2hhcmVkQ2xhc3MuZXh0ZW5kU2hhcmVkKHtcclxuICAgIGlkOiBudWxsLFxyXG4gICAgb3duZXI6IG51bGwsXHJcbiAgICBodWxsTWFwOiB7fSxcclxuICAgIGl0ZW1zTWFwOiB7fSxcclxuICAgIGhwOiAyMDAwLFxyXG4gICAgaW5pdDogZnVuY3Rpb24oc2V0dGluZ3MpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKCFzZXR0aW5ncy50bXhOYW1lICYmICFzZXR0aW5ncy5qc29uKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdTaGlwIHNldHRpbmdzIG11c3QgaGF2ZSB0bXhOYW1lIG9yIGpzb25EYXRhJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNldHRpbmdzLmpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy50bXhOYW1lID0gc2V0dGluZ3MuanNvbi50bXhOYW1lO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudG14TmFtZSA9IHNldHRpbmdzLnRteE5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubG9hZE1hcCgpO1xyXG4gICAgICAgIC8vQXJyYXkgb2YgaXRlbXMgYnVpbHRcclxuICAgICAgICB0aGlzLmJ1aWx0ID0gW107XHJcbiAgICAgICAgdGhpcy5pdGVtc01hcCA9IG5ldyBtYXBzLkVudGl0eU1hcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy5idWlsdCk7XHJcbiAgICAgICAgdGhpcy51bml0cyA9IFtdO1xyXG4gICAgICAgIHRoaXMudW5pdHNNYXAgPSBuZXcgbWFwcy5FbnRpdHlNYXAzZCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgdGhpcy51bml0cyk7XHJcbiAgICAgICAgdGhpcy5tYXAgPSBuZXcgbWFwcy5Db21wb3VuZE1hcChbXHJcbiAgICAgICAgICAgIG5ldyBtYXBzLk1hcCh0aGlzLmh1bGxNYXApLnNjYWxlKEdSSURfU1VCKSwgdGhpcy5pdGVtc01hcCxcclxuICAgICAgICAgICAgdGhpcy51bml0c01hcFxyXG4gICAgICAgIF0pO1xyXG4gICAgICAgIGlmIChzZXR0aW5ncy5qc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJvbUpzb24oc2V0dGluZ3MuanNvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxvYWRNYXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgaHVsbDtcclxuICAgICAgICBpZiAoIWh1bGxNYXBzKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdodWxsTWFwcyBnbG9iYWwgb2JqZWN0IG5vdCBmb3VuZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGh1bGwgPSBodWxsTWFwc1t0aGlzLnRteE5hbWUudG9Mb3dlckNhc2UoKV07XHJcbiAgICAgICAgaWYgKCFodWxsKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdodWxsTWFwIFwiJyArIHRoaXMudG14TmFtZS50b0xvd2VyQ2FzZSgpICsgJ1wiIG5vdCBmb3VuZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaHVsbE1hcCA9IGh1bGwubWFwO1xyXG4gICAgICAgIHRoaXMud2lkdGggPSBodWxsLndpZHRoICogR1JJRF9TVUI7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBodWxsLmhlaWdodCAqIEdSSURfU1VCO1xyXG4gICAgfSxcclxuICAgIC8vdGhpcyBzaG91bGQgYmUgY2FsbGVkIHdoZW4gdGhlIHVzZXIgYnVpbGRzIHNvbWV0aGluZ1xyXG4gICAgYnVpbGRBdDogZnVuY3Rpb24oeCwgeSwgYnVpbGRpbmdUeXBlKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBzZWxmLCBidWlsZGluZywgY2FuQnVpbGQsIGNhbkJ1aWxkUm90YXRlZDtcclxuICAgICAgICBzZWxmID0gdGhpcztcclxuICAgICAgICBpZiAoIWl0ZW1zW2J1aWxkaW5nVHlwZV0pIHtcclxuICAgICAgICAgICAgdGhyb3cgJ05vIHN1Y2ggaXRlbSB0eXBlIFwiJyArIGJ1aWxkaW5nVHlwZSArICdcIi4nO1xyXG4gICAgICAgIH1cclxuICAgICAgICBidWlsZGluZyA9IG5ldyBpdGVtc1tidWlsZGluZ1R5cGVdKHt9KTtcclxuICAgICAgICBjYW5CdWlsZCA9IGJ1aWxkaW5nLmNhbkJ1aWxkQXQoeCwgeSwgdGhpcyk7XHJcbiAgICAgICAgaWYgKCFjYW5CdWlsZCkge1xyXG4gICAgICAgICAgICBjYW5CdWlsZFJvdGF0ZWQgPSBidWlsZGluZy5jYW5CdWlsZFJvdGF0ZWQoeCwgeSwgdGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChjYW5CdWlsZFJvdGF0ZWQpIHtcclxuICAgICAgICAgICAgICAgIGJ1aWxkaW5nLnJvdGF0ZWQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNhbkJ1aWxkIHx8IGNhbkJ1aWxkUm90YXRlZCkge1xyXG4gICAgICAgICAgICBidWlsZGluZy54ID0geDtcclxuICAgICAgICAgICAgYnVpbGRpbmcueSA9IHk7XHJcbiAgICAgICAgICAgIC8vcmVtb3ZlIGFueXRoaW5nIGluIGl0cyB3YXlcclxuICAgICAgICAgICAgYnVpbGRpbmcudGlsZXMoZnVuY3Rpb24oaVgsIGlZKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUF0KGlYLCBpWSk7XHJcbiAgICAgICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZEl0ZW0oYnVpbGRpbmcpO1xyXG4gICAgICAgICAgICBidWlsZGluZy5vbkJ1aWx0KCk7XHJcbiAgICAgICAgICAgIHJldHVybiBidWlsZGluZzsgLy9idWlsZGluZyBzdWNjZXNzZnVsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsOyAvL2J1aWxkaW5nIGZhaWxlZFxyXG4gICAgfSxcclxuICAgIC8vZmluZHMgYSBjbGVhciBzcG90IGFuZCBjcmVhdGVzIGEgbmV3IHVuaXQgdGhlcmVcclxuICAgIHB1dFVuaXQ6IGZ1bmN0aW9uKHVuaXQsIHBvc2l0aW9uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIC8vZmluZCBlbXB0eSBzcG90XHJcbiAgICAgICAgdmFyIGVtcHR5ID0gbnVsbCwgc2hpcCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKCFwb3NpdGlvbikge1xyXG4gICAgICAgICAgICBwb3NpdGlvbiA9IHsvL2NlbnRlciBvZiB0aGUgc2hpcFxyXG4gICAgICAgICAgICAgICAgeDogTWF0aC5mbG9vcihzaGlwLndpZHRoIC8gMiksXHJcbiAgICAgICAgICAgICAgICB5OiBNYXRoLmZsb29yKHNoaXAuaGVpZ2h0IC8gMilcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZW1wdHkgPSB0aGlzLmNsb3Nlc3RUaWxlKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKHRpbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aWxlID09PSB0aWxlcy5jbGVhcjtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgdXRpbHMubWF0cml4VGlsZXMoc2hpcC53aWR0aCwgc2hpcC5oZWlnaHQsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbXB0eSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzaGlwLmF0KHgsIHkpID09PSB0aWxlcy5jbGVhcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVtcHR5ID0ge3g6IHgsIHk6IHl9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAoIWVtcHR5KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgZW1wdHkgcG9zaXRpb24gaW4gc2hpcCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB1bml0LnggPSBlbXB0eS54O1xyXG4gICAgICAgIHVuaXQueSA9IGVtcHR5Lnk7XHJcbiAgICAgICAgaWYgKHVuaXQub3duZXJJRCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHVuaXQub3duZXJJRCA9IHRoaXMub3duZXIuaWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWRkVW5pdCh1bml0KTtcclxuICAgICAgICByZXR1cm4gdW5pdDtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIEZpbmRzIHRoZSBjbG9zZXN0IHBvc2l0aW9uIHRvIHgsIHkgdGhhdCBzYXRpc2ZpZXMgdGhlIGNvbmRpdGlvblxyXG4gICAgICogZm9yIHRoZSB0aWxlIGF0IHRoYXQgcG9zaXRpb24uXHJcbiAgICAgKiBJdCBzZWFyY2hlcyB0aGUgbWFwIGluIGEgc3BpcmFsIGZhc2hpb24gZnJvbSB0aGUgc3RhcnRpbmcgdGlsZS5cclxuICAgICAqIEBwYXJhbSB7aW50fSB4XHJcbiAgICAgKiBAcGFyYW0ge2ludH0geVxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY29uZGl0aW9uXHJcbiAgICAgKiBAcmV0dXJuIHt7eDogaW50LCB5OiBpbnR9fVxyXG4gICAgICovXHJcbiAgICBjbG9zZXN0VGlsZTogZnVuY3Rpb24oeCwgeSwgY29uZGl0aW9uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBzcXVhcmVXaWR0aCA9IDEsXHJcbiAgICAgICAgICAgIGdvaW5nID0gJ3JpZ2h0JyxcclxuICAgICAgICAgICAgZGlyZWN0aW9uLFxyXG4gICAgICAgICAgICBpLFxyXG4gICAgICAgICAgICB3aWR0aFRpbWVzMixcclxuICAgICAgICAgICAgaGVpZ2h0VGltZXMyO1xyXG4gICAgICAgIGlmIChjb25kaXRpb24odGhpcy5tYXAuYXQoeCwgeSkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7eDogeCwgeTogeX07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpZHRoVGltZXMyID0gdGhpcy53aWR0aCAqIDI7XHJcbiAgICAgICAgaGVpZ2h0VGltZXMyID0gdGhpcy5oZWlnaHQgKiAyO1xyXG4gICAgICAgIGRvIHtcclxuICAgICAgICAgICAgLy9jaGFuZ2UgZGlyZWN0aW9uXHJcbiAgICAgICAgICAgIHN3aXRjaCAoZ29pbmcpIHtcclxuICAgICAgICAgICAgY2FzZSAnZG93bic6XHJcbiAgICAgICAgICAgICAgICBnb2luZyA9ICdsZWZ0JztcclxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFstMSwgMF07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnbGVmdCc6XHJcbiAgICAgICAgICAgICAgICBnb2luZyA9ICd1cCc7XHJcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBbMCwgLTFdO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3VwJzpcclxuICAgICAgICAgICAgICAgIGdvaW5nID0gJ3JpZ2h0JztcclxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFsxLCAwXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdyaWdodCc6XHJcbiAgICAgICAgICAgICAgICBnb2luZyA9ICdkb3duJztcclxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFswLCAxXTtcclxuICAgICAgICAgICAgICAgIC8vbW92ZSB0byBuZXh0IG91dGVyIHNxdWFyZVxyXG4gICAgICAgICAgICAgICAgc3F1YXJlV2lkdGggKz0gMjtcclxuICAgICAgICAgICAgICAgIHgrKztcclxuICAgICAgICAgICAgICAgIHktLTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vdHJhdmVyc2Ugb25lIHNpZGVcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNxdWFyZVdpZHRoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB4ICs9IGRpcmVjdGlvblswXTtcclxuICAgICAgICAgICAgICAgIHkgKz0gZGlyZWN0aW9uWzFdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbmRpdGlvbih0aGlzLm1hcC5hdCh4LCB5KSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge3g6IHgsIHk6IHl9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSB3aGlsZSAoc3F1YXJlV2lkdGggPCB3aWR0aFRpbWVzMiAmJiBzcXVhcmVXaWR0aCA8IGhlaWdodFRpbWVzMik7XHJcbiAgICAgICAgLy9kaWRuJ3QgZmluZCBhbnlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH0sXHJcbiAgICAvL0FkZHMgYW4gaXRlbSB0byB0aGUgc2hpcCBpZ25vcmluZyBpdHMgcGxhY2VtZW50IHJ1bGVzXHJcbiAgICBhZGRJdGVtOiBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmIChpdGVtLmlkID09PSB1bmRlZmluZWQgfHwgaXRlbS5pZCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmFzc2lnbkl0ZW1JRChpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idWlsdC5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIGl0ZW0ub25TaGlwKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuYnVpbGRpbmdzQ2hhbmdlZCgpO1xyXG4gICAgfSxcclxuICAgIGFzc2lnbkl0ZW1JRDogZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAodGhpcy5idWlsdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgaXRlbS5pZCA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaXRlbS5pZCA9IF8ubWF4KHRoaXMuYnVpbHQsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGUuaWQ7XHJcbiAgICAgICAgfSkuaWQgKyAxO1xyXG4gICAgfSxcclxuICAgIGFkZFVuaXQ6IGZ1bmN0aW9uKHVuaXQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgaWYgKHVuaXQuaWQgPT09IHVuZGVmaW5lZCB8fCB1bml0LmlkID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmF0dGxlLmFzc2lnblVuaXRJRCh1bml0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51bml0cy5wdXNoKHVuaXQpO1xyXG4gICAgICAgIHVuaXQuc2hpcCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy51bml0c01hcC51cGRhdGUoKTtcclxuICAgIH0sXHJcbiAgICBnZXRVbml0QnlJRDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIF8uZmluZCh0aGlzLnVuaXRzLCBmdW5jdGlvbih1KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1LmlkID09PSBwYXJzZUludChpZCwgMTApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGdldEl0ZW1CeUlEOiBmdW5jdGlvbihpZCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gXy5maW5kKHRoaXMuYnVpbHQsIGZ1bmN0aW9uKGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGIuaWQgPT09IHBhcnNlSW50KGlkLCAxMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgZ2V0UGxheWVyVW5pdHM6IGZ1bmN0aW9uKHBsYXllcklEKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiBfLmZpbHRlcih0aGlzLnVuaXRzLCBmdW5jdGlvbih1bml0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1bml0Lm93bmVySUQgPT09IHBsYXllcklEO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZUF0OiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIC8vcmVtb3ZlIHdoaWxlIGlzIG5vdCBzdHJpbmcgKGlzIGFuIGl0ZW0gb3IgdW5pdClcclxuICAgICAgICB3aGlsZSAoIShfLmlzU3RyaW5nKHRoaXMuYXQoeCwgeSkpKSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSh0aGlzLmF0KHgsIHkpLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpdGVtLCB1cGRhdGVCdWlsZGluZ3MpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGluZGV4O1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1cGRhdGVCdWlsZGluZ3MgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB1cGRhdGVCdWlsZGluZ3MgPSB0cnVlOyAvL3VwZGF0ZXMgYnkgZGVmYXVsdFxyXG4gICAgICAgIH1cclxuICAgICAgICBpbmRleCA9IF8uaW5kZXhPZih0aGlzLmJ1aWx0LCBpdGVtKTtcclxuICAgICAgICB0aGlzLmJ1aWx0LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgaWYgKHVwZGF0ZUJ1aWxkaW5ncykge1xyXG4gICAgICAgICAgICB0aGlzLmJ1aWxkaW5nc0NoYW5nZWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlQWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpO1xyXG4gICAgICAgIGZvciAoaSA9IHRoaXMuYnVpbHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgc2VsZi5yZW1vdmUodGhpcy5idWlsdFtpXSwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1aWxkaW5nc0NoYW5nZWQoKTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVVbml0OiBmdW5jdGlvbih1bml0KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBpbmRleCA9IF8uaW5kZXhPZih0aGlzLnVuaXRzLCB1bml0KTtcclxuICAgICAgICB0aGlzLnVuaXRzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy51bml0c01hcC51cGRhdGUoKTtcclxuICAgIH0sXHJcbiAgICAvL3RvIGNhbGwgd2hlbmV2ZXIgYnVpbGRpbmdzIGNoYW5nZVxyXG4gICAgYnVpbGRpbmdzQ2hhbmdlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMuaXRlbXNNYXAudXBkYXRlKCk7XHJcbiAgICAgICAgdGhpcy5vbkJ1aWxkaW5nc0NoYW5nZWQoKTtcclxuICAgIH0sXHJcbiAgICBvbkJ1aWxkaW5nc0NoYW5nZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH0sXHJcbiAgICBhdDogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAuYXQoeCwgeSk7XHJcbiAgICB9LFxyXG4gICAgaGFzVW5pdHM6IGZ1bmN0aW9uKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuaXRzTWFwLmF0KHBvc2l0aW9uLngsIHBvc2l0aW9uLnkpO1xyXG4gICAgfSxcclxuICAgIGlzSW5zaWRlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB0aWxlID0gdGhpcy5hdCh4LCB5KTtcclxuICAgICAgICByZXR1cm4gdGlsZSAhPT0gdGlsZXMuc29saWQgJiYgdGlsZSAhPT0gdGlsZXMuZnJvbnQgJiZcclxuICAgICAgICAgICAgdGlsZSAhPT0gdGlsZXMuYmFjaztcclxuICAgIH0sXHJcbiAgICB0b0pzb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAndG14TmFtZSc6IHRoaXMudG14TmFtZSxcclxuICAgICAgICAgICAgJ2lkJzogdGhpcy5pZCxcclxuICAgICAgICAgICAgJ2hwJzogdGhpcy5ocCxcclxuICAgICAgICAgICAgJ293bmVyJzogdGhpcy5vd25lciA/IHRoaXMub3duZXIudG9Kc29uKCkgOiBudWxsLFxyXG4gICAgICAgICAgICAnYnVpbGRpbmdzJzogdXRpbHMubWFwVG9Kc29uKHRoaXMuYnVpbHQpLFxyXG4gICAgICAgICAgICAndW5pdHMnOiB1dGlscy5tYXBUb0pzb24odGhpcy51bml0cyksXHJcbiAgICAgICAgICAgICdHUklEX1NVQic6IEdSSURfU1VCXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBmcm9tSnNvbjogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgc2hpcCA9IHRoaXMsXHJcbiAgICAgICAgICAgIGpzb25HcmlkU3ViO1xyXG4gICAgICAgIGlmIChqc29uLmlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IHBhcnNlSW50KGpzb24uaWQsIDEwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGpzb24uaHAgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLmhwID0gcGFyc2VJbnQoanNvbi5ocCwgMTApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm93bmVyID0gbmV3IFBsYXllcihqc29uLm93bmVyKTtcclxuICAgICAgICBpZiAoanNvbi5HUklEX1NVQiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGpzb25HcmlkU3ViID0gcGFyc2VJbnQoanNvbi5HUklEX1NVQiwgMTApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGpzb25HcmlkU3ViID0gMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2hpcC5yZW1vdmVBbGwoKTtcclxuICAgICAgICBpZiAoR1JJRF9TVUIgIT09IGpzb25HcmlkU3ViKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignR1JJRF9TVUIgZnJvbSBqc29uIGRpZmZlcnMgZnJvbSBjdXJyZW50IEdSSURfU1VCLCcgK1xyXG4gICAgICAgICAgICAgICAgJyB0aGUgdmFsdWVzIHdpbGwgYmUgY29udmVydGVkLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfLmVhY2goanNvbi5idWlsZGluZ3MsIGZ1bmN0aW9uKGIpIHtcclxuICAgICAgICAgICAgaWYgKEdSSURfU1VCICE9PSBqc29uR3JpZFN1Yikge1xyXG4gICAgICAgICAgICAgICAgdXRpbHMuY29udmVydFBvc2l0aW9uKGIsIGpzb25HcmlkU3ViLCBHUklEX1NVQik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2hpcC5hZGRJdGVtKG5ldyBpdGVtc1tiLnR5cGVdKGIpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBfLmVhY2goanNvbi51bml0cywgZnVuY3Rpb24odSkge1xyXG4gICAgICAgICAgICBpZiAodS50eXBlID09PSAnVW5pdCcpIHsvL2lzIGdlbmVyaWMgdW5pdFxyXG4gICAgICAgICAgICAgICAgc2hpcC5hZGRVbml0KG5ldyBVbml0KHUpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHsgLy9pcyBzcGVjaWZpYyB1bml0XHJcbiAgICAgICAgICAgICAgICBzaGlwLmFkZFVuaXQobmV3IHVuaXRzW3UudHlwZV0odSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5idWlsZGluZ3NDaGFuZ2VkKCk7XHJcbiAgICB9LFxyXG4gICAgZ2V0UGZNYXRyaXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgc2hpcCA9IHRoaXMsXHJcbiAgICAgICAgICAgIHBmTWF0cml4ID0gdXRpbHMuZ2V0RW1wdHlNYXRyaXgodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIDEpO1xyXG4gICAgICAgIHNoaXAubWFwLnRpbGVzKGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgICAgICAgaWYgKHNoaXAuaXNXYWxrYWJsZSh4LCB5KSkge1xyXG4gICAgICAgICAgICAgICAgcGZNYXRyaXhbeV1beF0gPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHBmTWF0cml4O1xyXG4gICAgfSxcclxuICAgIGlzV2Fsa2FibGU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHRpbGUgPSB0aGlzLm1hcC5hdCh4LCB5KTtcclxuICAgICAgICAvL2NsZWFyIHRpbGVzIGFuZCB1bml0cyBhcmUgd2Fsa2FibGVcclxuICAgICAgICByZXR1cm4gdGlsZSA9PT0gdGlsZXMuY2xlYXIgfHwgdGhpcy5oYXNVbml0cyh7eDogeCwgeTogeX0pIHx8XHJcbiAgICAgICAgICAgICh0aWxlIGluc3RhbmNlb2YgSXRlbSAmJiB0aWxlLndhbGthYmxlKTtcclxuICAgIH0sXHJcbiAgICBlbmRPZlR1cm5SZXNldDogZnVuY3Rpb24odHVybkR1cmF0aW9uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaSxcclxuICAgICAgICAgICAgdW5pdDtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy51bml0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB1bml0ID0gdGhpcy51bml0c1tpXTtcclxuICAgICAgICAgICAgaWYgKCF1bml0LmlzQWxpdmUoKSkge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVVbml0KHVuaXQpO1xyXG4gICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVuaXQuY2hhcmdpbmdTaGlwV2VhcG9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdC5jaGFyZ2luZ1NoaXBXZWFwb24uc3RhcnRpbmdUaW1lIC09IHR1cm5EdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHVuaXQuZGlzdHJhY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdW5pdC50ZWxlcG9ydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51bml0c01hcC51cGRhdGUoKTtcclxuICAgIH0sXHJcbiAgICBnZXRWYWxpZE9yZGVyRm9yUG9zOiBmdW5jdGlvbih1bml0LCBwb3MpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHN0dWZmID0gdGhpcy5tYXAuYXQocG9zLngsIHBvcy55KSxcclxuICAgICAgICAgICAgZW5lbWllcyxcclxuICAgICAgICAgICAgb3JkZXI7XHJcbiAgICAgICAgaWYgKF8uaXNBcnJheShzdHVmZikpIHtcclxuICAgICAgICAgICAgZW5lbWllcyA9IF8uZmlsdGVyKHN0dWZmLCBmdW5jdGlvbih1KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdSBpbnN0YW5jZW9mIFVuaXQgJiYgdS5pc0VuZW15KHVuaXQpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGVuZW1pZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgb3JkZXIgPSBuZXcgb3JkZXJzLlNlZWtBbmREZXN0cm95KHtcclxuICAgICAgICAgICAgICAgICAgICB1bml0SUQ6IHVuaXQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0SUQ6IGVuZW1pZXNbMF0uaWRcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHN0dWZmIGluc3RhbmNlb2YgaXRlbXMuQ29uc29sZSkge1xyXG4gICAgICAgICAgICAgICAgb3JkZXIgPSBuZXcgb3JkZXJzLk1vdmVUb0NvbnNvbGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRJRDogdW5pdC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjoge3g6IHBvcy54LCB5OiBwb3MueX1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNXYWxrYWJsZShwb3MueCwgcG9zLnkpKSB7XHJcbiAgICAgICAgICAgICAgICBvcmRlciA9IG5ldyBvcmRlcnMuTW92ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgdW5pdElEOiB1bml0LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uOiB7eDogcG9zLngsIHk6IHBvcy55fVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9yZGVyICYmIG9yZGVyLmlzVmFsaWQodGhpcywgdW5pdC5vd25lcklEKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gb3JkZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgbWUsIHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cyovXHJcblxyXG52YXIgc2ggPSBtb2R1bGUuZXhwb3J0cyxcclxuICAgIEpzb25hYmxlID0gcmVxdWlyZSgnLi9qc29uYWJsZScpLkpzb25hYmxlO1xyXG4vKipcclxuICogQW4gb2JqZWN0IG9uIHRoZSBzaGlwLiAoQW4gaXRlbSwgYW4gdW5pdCwgZXRjKVxyXG4gKiBAdHlwZSB7Kn1cclxuICovXHJcbnNoLlRpbGVFbnRpdHkgPSBKc29uYWJsZS5leHRlbmRTaGFyZWQoe1xyXG4gICAgaWQ6IG51bGwsIC8vdGhlIHNoaXAgaXMgaW4gY2hhcmdlIG9mIHNldHRpbmcgdGhlIGlkXHJcbiAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdUaWxlRW50aXR5JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczogWydpZCcsICd4JywgJ3knXSxcclxuICAgICAgICAgICAganNvbjoganNvblxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIC8vdGFrZXMgcm90YXRpb24gaW50byBhY2NvdW50XHJcbiAgICB0cnVlU2l6ZTogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgLy8ob25seSBpdGVtcyBjYW4gcm90YXRlLCBub3QgdW5pdHMpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZVtpbmRleF07XHJcbiAgICB9LFxyXG4gICAgLy9jYWxsYmFjayBtdXN0IGhhdmUgeCBhbmQgeS4gd2l0aGluU2l6ZSBpcyBvcHRpb25hbFxyXG4gICAgdGlsZXM6IGZ1bmN0aW9uKGNhbGxiYWNrLCB3aXRoaW5TaXplKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciB4LCB5LFxyXG4gICAgICAgICAgICB3aWR0aCA9IHRoaXMudHJ1ZVNpemUoMCksXHJcbiAgICAgICAgICAgIGhlaWdodCA9IHRoaXMudHJ1ZVNpemUoMSk7XHJcbiAgICAgICAgZm9yICh4ID0gdGhpcy54OyB4IDwgd2lkdGggKyB0aGlzLnggJiZcclxuICAgICAgICAgICAgICAgICghd2l0aGluU2l6ZSB8fCB4IDwgd2l0aGluU2l6ZS53aWR0aCkgJiYgeCA+PSAwOyB4KyspIHtcclxuICAgICAgICAgICAgZm9yICh5ID0gdGhpcy55OyB5IDwgaGVpZ2h0ICsgdGhpcy55ICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKCF3aXRoaW5TaXplIHx8IHkgPCB3aXRoaW5TaXplLmhlaWdodCkgJiYgeSA+PSAwOyB5KyspIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHgsIHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGdldFRpbGVzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHRpbGVzID0gW10sIHgsIHksXHJcbiAgICAgICAgICAgIHdpZHRoID0gdGhpcy50cnVlU2l6ZSgwKSxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gdGhpcy50cnVlU2l6ZSgxKTtcclxuICAgICAgICBmb3IgKHggPSB0aGlzLng7IHggPCB3aWR0aCArIHRoaXMueCAmJiB4ID49IDA7IHgrKykge1xyXG4gICAgICAgICAgICBmb3IgKHkgPSB0aGlzLnk7IHkgPCBoZWlnaHQgKyB0aGlzLnkgJiYgeSA+PSAwOyB5KyspIHtcclxuICAgICAgICAgICAgICAgIHRpbGVzLnB1c2goe3g6IHgsIHk6IHl9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGlsZXM7XHJcbiAgICB9LFxyXG4gICAgLy9yZXR1cm5zIHRydWUgaXMgc29tZSBwYXJ0IG9mIHRoZSBlbnRpdHkgaXMgb2NjdXB5aW5nIHRoZSB0aWxlXHJcbiAgICBvY2N1cGllczogZnVuY3Rpb24odGlsZSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgeCA9IHRpbGUueCwgeSA9IHRpbGUueTtcclxuICAgICAgICByZXR1cm4geCA+PSB0aGlzLnggJiYgeCA8IHRoaXMueCArIHRoaXMudHJ1ZVNpemUoMCkgJiZcclxuICAgICAgICAgICAgeSA+PSB0aGlzLnkgJiYgeSA8IHRoaXMueSArIHRoaXMudHJ1ZVNpemUoMSk7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIG1lLCByZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUqL1xyXG5cclxudmFyIHNoID0gbW9kdWxlLmV4cG9ydHMsXHJcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLl8sXHJcbiAgICBUaWxlRW50aXR5ID0gcmVxdWlyZSgnLi90aWxlLWVudGl0eScpLlRpbGVFbnRpdHksXHJcbiAgICBVbml0T3JkZXJzID0gcmVxdWlyZSgnLi9vcmRlcnMnKS5Vbml0T3JkZXJzLFxyXG4gICAgaXRlbXMgPSByZXF1aXJlKCcuL2l0ZW1zJykuaXRlbXMsXHJcbiAgICBhY3QgPSByZXF1aXJlKCcuL2FjdGlvbnMnKS5hY3Rpb25zLFxyXG4gICAgdiA9IHJlcXVpcmUoJy4uL2dlbmVyYWwtc3R1ZmYnKS52O1xyXG5cclxuLyoqXHJcbiAqIEEgY3JldyBtZW1iZXIuXHJcbiAqIEB0eXBlIHsqfVxyXG4gKi9cclxuc2guVW5pdCA9IFRpbGVFbnRpdHkuZXh0ZW5kU2hhcmVkKHtcclxuICAgIGltZ0luZGV4OiAwLFxyXG4gICAgc3BlZWQ6IDEsIC8vdGlsZXMgcGVyIHNlY29uZFxyXG4gICAgbWF4SFA6IDEwMCxcclxuICAgIG1lbGVlRGFtYWdlOiAyMCxcclxuICAgIGF0dGFja0Nvb2xkb3duOiA1MDAsLy90aW1lIChtcykgYmV0d2VlbiBlYWNoIGF0dGFja1xyXG4gICAgYXR0YWNrUmFuZ2U6IDEsXHJcbiAgICBpbWFnZUZhY2VzUmlnaHQ6IHRydWUsXHJcbiAgICBibG9ja2luZzogdHJ1ZSwvL2lmIGl0IHNsb3dzIGVuZW15IHVuaXRzIHBhc3NpbmcgYnlcclxuICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgdGhpcy5zaXplID0gWzEsIDFdO1xyXG4gICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgIHR5cGU6ICdVbml0JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczogWydpbWdJbmRleCcsICdzcGVlZCcsICdtYXhIUCcsICdtZWxlZURhbWFnZScsXHJcbiAgICAgICAgICAgICAgICAnYXR0YWNrQ29vbGRvd24nLCAnYXR0YWNrUmFuZ2UnLCAnaW1hZ2VGYWNlc1JpZ2h0JywgJ293bmVySUQnLFxyXG4gICAgICAgICAgICAgICAgJ2NoYXJnaW5nU2hpcFdlYXBvbicsICd0ZWxlcG9ydFNvdXJjZSddLFxyXG4gICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5ocCA9IHRoaXMubWF4SFA7XHJcbiAgICAgICAgdGhpcy5pbkNvbWJhdCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMub3JkZXJzID0gW107XHJcbiAgICB9LFxyXG4gICAgbWFrZVVuaXRPcmRlcnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgdW5pdE9yZGVycyA9IG5ldyBVbml0T3JkZXJzKHtcclxuICAgICAgICAgICAgdW5pdElEOiB0aGlzLmlkXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdW5pdE9yZGVycy5hcnJheSA9IHRoaXMub3JkZXJzO1xyXG4gICAgICAgIHJldHVybiB1bml0T3JkZXJzO1xyXG4gICAgfSxcclxuICAgIGlzQWxpdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gdGhpcy5ocCA+IDA7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGltZUZvck9uZVRpbGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gMTAwMCAvIHRoaXMuc3BlZWQ7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGltZUZvck1vdmluZzogZnVuY3Rpb24oZnJvbSwgdG8sIHNoaXApIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBvbmVUaWxlVGltZSA9IHRoaXMuZ2V0VGltZUZvck9uZVRpbGUoKSxcclxuICAgICAgICAgICAgdGlsZURpc3RhbmNlLFxyXG4gICAgICAgICAgICBpc0RpYWdvbmFsLFxyXG4gICAgICAgICAgICB0aW1lO1xyXG4gICAgICAgIHRpbGVEaXN0YW5jZSA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGEgPSB0by54IC0gZnJvbS54LFxyXG4gICAgICAgICAgICAgICAgYiA9IHRvLnkgLSBmcm9tLnk7XHJcbiAgICAgICAgICAgIGlmIChhID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYiA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLWI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoYSA8IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtYTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYTtcclxuICAgICAgICB9KCkpO1xyXG4gICAgICAgIGlzRGlhZ29uYWwgPSB0by54IC0gZnJvbS54ICE9PSAwICYmIHRvLnkgLSBmcm9tLnkgIT09IDA7XHJcbiAgICAgICAgaWYgKGlzRGlhZ29uYWwpIHtcclxuICAgICAgICAgICAgdGltZSA9IHRpbGVEaXN0YW5jZSAqIG9uZVRpbGVUaW1lICogMS40MTQyMTM1NjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aW1lID0gdGlsZURpc3RhbmNlICogb25lVGlsZVRpbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChfLmFueShzaGlwLmF0KGZyb20ueCwgZnJvbS55KSwgZnVuY3Rpb24odSkge1xyXG4gICAgICAgICAgICAgICAgLy9hbiBlbmVteSBibG9ja3NcclxuICAgICAgICAgICAgICAgIHJldHVybiB1LmlzQWxpdmUoKSAmJiB1Lm93bmVySUQgIT09IHNlbGYub3duZXJJRCAmJiB1LmJsb2NraW5nO1xyXG4gICAgICAgICAgICB9KSkge1xyXG4gICAgICAgICAgICAvL3Rha2VzIDQgdGltZXMgbG9uZ2VyXHJcbiAgICAgICAgICAgIHRpbWUgKj0gNDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRpbWU7XHJcbiAgICB9LFxyXG4gICAgZ2V0QXR0YWNrQWN0aW9uczogZnVuY3Rpb24oKSB7Ly8odHVyblRpbWUsIGJhdHRsZSlcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGVuZW1pZXNJblJhbmdlLFxyXG4gICAgICAgICAgICBlbmVteVRvQXR0YWNrO1xyXG4gICAgICAgIGlmICghdGhpcy5vbkNvb2xkb3duICYmICF0aGlzLm1vdmluZyAmJiAhdGhpcy5kaXp6eSkgey8vYXR0YWNrIHJlYWR5XHJcbiAgICAgICAgICAgIGVuZW1pZXNJblJhbmdlID0gXy5maWx0ZXIodGhpcy5zaGlwLnVuaXRzLFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24odSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1LmlzQWxpdmUoKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmlzRW5lbXkodSkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pc0luUmFuZ2UodSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0SUQgIT09IG51bGwgJiYgdGhpcy50YXJnZXRJRCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAvL2lmIHRhcmdldElEIGlzIHNldCwgaXQgaGFzIGF0dGFjayBwcmlvcml0eVxyXG4gICAgICAgICAgICAgICAgZW5lbXlUb0F0dGFjayA9IF8ud2hlcmUoZW5lbWllc0luUmFuZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAge2lkOiB0aGlzLnRhcmdldElEfSlbMF0gfHxcclxuICAgICAgICAgICAgICAgICAgICBlbmVtaWVzSW5SYW5nZVswXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGVuZW15VG9BdHRhY2sgPSBlbmVtaWVzSW5SYW5nZVswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZW5lbXlUb0F0dGFjaykge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9ucy5wdXNoKG5ldyBhY3QuQXR0YWNrKHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRhY2tlcklEOiBzZWxmLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlY2VpdmVySUQ6IGVuZW15VG9BdHRhY2suaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZGFtYWdlOiBzZWxmLm1lbGVlRGFtYWdlLFxyXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBzZWxmLmF0dGFja0Nvb2xkb3duXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XHJcbiAgICB9LFxyXG4gICAgaW5UZWxlcG9ydGVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hpcC5pdGVtc01hcC5hdCh0aGlzLngsIHRoaXMueSkgaW5zdGFuY2VvZlxyXG4gICAgICAgICAgICBpdGVtcy5UZWxlcG9ydGVyO1xyXG4gICAgfSxcclxuICAgIGdldE9yZGVyc0FjdGlvbnM6IGZ1bmN0aW9uKHR1cm5UaW1lLCBiYXR0bGUpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGFjdGlvbnM7XHJcbiAgICAgICAgaWYgKHRoaXMub3JkZXJzLmxlbmd0aCA+IDAgJiYgIXRoaXMuaW5UZWxlcG9ydGVyKCkpIHtcclxuICAgICAgICAgICAgYWN0aW9ucyA9IHRoaXMub3JkZXJzWzBdLmdldEFjdGlvbnModHVyblRpbWUsIGJhdHRsZSk7XHJcbiAgICAgICAgICAgIC8vaWYgaXQncyBub3QgZ29ubmEgbWFrZSBpdCxcclxuICAgICAgICAgICAgLy9mb3JjZSBhcnJpdmFsIHRvIHRoZSB0aWxlIGF0IGVuZCBvZiB0dXJuXHJcbiAgICAgICAgICAgIGlmICh0dXJuVGltZSA8IGJhdHRsZS50dXJuRHVyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIF8uY2hhaW4oYWN0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICAud2hlcmUoe3R5cGU6ICdNb3ZlJ30pXHJcbiAgICAgICAgICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24oYSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYS5kdXJhdGlvbiArIHR1cm5UaW1lID4gYmF0dGxlLnR1cm5EdXJhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYS5kdXJhdGlvbiA9IGJhdHRsZS50dXJuRHVyYXRpb24gLSB0dXJuVGltZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhY3Rpb25zO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9LFxyXG4gICAgZ2V0RGFtYWdlU2hpcEFjdGlvbnM6IGZ1bmN0aW9uKCkgey8vKHR1cm5UaW1lLCBiYXR0bGUpXHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICh0aGlzLm93bmVySUQgIT09IHRoaXMuc2hpcC5vd25lci5pZCAmJlxyXG4gICAgICAgICAgICAgICAgIXRoaXMubW92aW5nICYmXHJcbiAgICAgICAgICAgICAgICAhdGhpcy5vbkNvb2xkb3duICYmIC8vYXR0YWNrIHJlYWR5XHJcbiAgICAgICAgICAgICAgICAhdGhpcy5kaXp6eSAmJlxyXG4gICAgICAgICAgICAgICAgIXRoaXMuaW5Db21iYXQgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hpcC5pdGVtc01hcC5hdCh0aGlzLngsIHRoaXMueSkgaW5zdGFuY2VvZlxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLldlYWtTcG90KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbbmV3IGFjdC5EYW1hZ2VTaGlwKHtcclxuICAgICAgICAgICAgICAgIHNoaXBJRDogdGhpcy5zaGlwLmlkLFxyXG4gICAgICAgICAgICAgICAgdW5pdElEOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgdGlsZToge3g6IHRoaXMueCwgeTogdGhpcy55fSxcclxuICAgICAgICAgICAgICAgIGRhbWFnZTogdGhpcy5tZWxlZURhbWFnZSxcclxuICAgICAgICAgICAgICAgIGNvb2xkb3duOiB0aGlzLmF0dGFja0Nvb2xkb3duXHJcbiAgICAgICAgICAgIH0pXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogSWYgaXQncyBpbiBhIGNvbnNvbGUgY29udHJvbGxpbmcgc29tZSBzaGlwIHN0cnVjdHVyZS5cclxuICAgICAqL1xyXG4gICAgZ2V0U2hpcENvbnRyb2xBY3Rpb25zOiBmdW5jdGlvbigpIHsvLyh0dXJuVGltZSwgYmF0dGxlKVxyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICBpZiAodGhpcy5vd25lcklEICE9PSB0aGlzLnNoaXAub3duZXIuaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgc3RhbmRpbmdPbiA9IHRoaXMuc2hpcC5pdGVtc01hcC5hdCh0aGlzLngsIHRoaXMueSksXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZWQ7XHJcbiAgICAgICAgaWYgKHN0YW5kaW5nT24gaW5zdGFuY2VvZiBpdGVtcy5Db25zb2xlKSB7XHJcbiAgICAgICAgICAgIGNvbnRyb2xsZWQgPSBzdGFuZGluZ09uLmdldENvbnRyb2xsZWQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNvbnRyb2xsZWQgaW5zdGFuY2VvZiBpdGVtcy5XZWFwb24gJiYgIWNvbnRyb2xsZWQuY2hhcmdlZEJ5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbbmV3IGFjdC5CZWdpblNoaXBXZWFwb25DaGFyZ2Uoe1xyXG4gICAgICAgICAgICAgICAgdW5pdElEOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgd2VhcG9uSUQ6IGNvbnRyb2xsZWQuaWQsXHJcbiAgICAgICAgICAgICAgICBjaGFyZ2VUaW1lOiBjb250cm9sbGVkLmNoYXJnZVRpbWVcclxuICAgICAgICAgICAgfSldO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBieSB0aGUgc2NyaXB0IGNyZWF0b3IgZXZlcnkgdGltZSBzb21ldGhpbmdcclxuICAgICAqIGNoYW5nZWQuIFRoZSB1bml0J3MgcHJvcGVydGllcyBzaG91bGQgbm90IGJlIGNoYW5nZWQgaW4gdGhpcyBtZXRob2Q7XHJcbiAgICAgKiB0aGUgc2NyaXB0IGNyZWF0b3IgZG9lcyB0aGF0IHRocm91Z2ggdGhlIG1vZGVsQ2hhbmdlcyBhcnJheSBmb3VuZCBpblxyXG4gICAgICogZWFjaCBhY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0ge2ludH0gdHVyblRpbWUgVGhlIGN1cnJlbnQgdGltZS5cclxuICAgICAqIEBwYXJhbSB7c2guQmF0dGxlfSBiYXR0bGUgVGhlIGJhdHRsZSwgcmVwcmVzZW50aW5nIHRoZSBlbnRpcmUgbW9kZWxcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBnZXRBY3Rpb25zOiBmdW5jdGlvbih0dXJuVGltZSwgYmF0dGxlKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBhY3Rpb25zID0gW10sXHJcbiAgICAgICAgICAgIHNoaXBXZWFwb247XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzQWxpdmUoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vdHVybiBzdGFydCByZXNldFxyXG4gICAgICAgIGlmICh0dXJuVGltZSA9PT0gMCAmJiAhdGhpcy5tb3ZpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5ibG9ja2luZyA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghdGhpcy5jaGFyZ2luZ1NoaXBXZWFwb24pIHtcclxuICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KHRoaXMuZ2V0QXR0YWNrQWN0aW9ucyh0dXJuVGltZSwgYmF0dGxlKSk7XHJcbiAgICAgICAgICAgIGlmIChhY3Rpb25zLmxlbmd0aCA9PT0gMCkgey8vZGFtYWdlIHNoaXAgb25seSBpZiBpdCBkaWRuJ3QgYXR0YWNrXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zID0gYWN0aW9ucy5jb25jYXQodGhpcy5nZXREYW1hZ2VTaGlwQWN0aW9ucyh0dXJuVGltZSxcclxuICAgICAgICAgICAgICAgICAgICBiYXR0bGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZGlzdHJhY3RlZCkge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0U2hpcENvbnRyb2xBY3Rpb25zKHR1cm5UaW1lLCBiYXR0bGUpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2hpcFdlYXBvbiA9IHRoaXMuc2hpcC5nZXRJdGVtQnlJRChcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hhcmdpbmdTaGlwV2VhcG9uLndlYXBvbklEXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0dXJuVGltZSA+PSB0aGlzLmNoYXJnaW5nU2hpcFdlYXBvbi5zdGFydGluZ1RpbWUgK1xyXG4gICAgICAgICAgICAgICAgICAgIHNoaXBXZWFwb24uY2hhcmdlVGltZSkge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9ucy5wdXNoKG5ldyBhY3QuRmlyZVNoaXBXZWFwb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIHVuaXRJRDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICB3ZWFwb25JRDogdGhpcy5jaGFyZ2luZ1NoaXBXZWFwb24ud2VhcG9uSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0SUQ6IGJhdHRsZS5nZXRFbmVteVNoaXBzKHRoaXMub3duZXJJRClbMF0uaWRcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBhY3Rpb25zID0gYWN0aW9ucy5jb25jYXQodGhpcy5nZXRPcmRlcnNBY3Rpb25zKHR1cm5UaW1lLCBiYXR0bGUpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XHJcbiAgICB9LFxyXG4gICAgaXNFbmVteTogZnVuY3Rpb24odW5pdCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gdW5pdC5vd25lcklEICE9PSB0aGlzLm93bmVySUQ7XHJcbiAgICB9LFxyXG4gICAgaXNJblJhbmdlOiBmdW5jdGlvbih1bml0KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiB2LmRpc3RhbmNlKHVuaXQsIHRoaXMpIDw9IHRoaXMuYXR0YWNrUmFuZ2U7XHJcbiAgICB9LFxyXG4gICAgY2FuY2VsU2hpcFdlYXBvbkZpcmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgd2VhcG9uO1xyXG4gICAgICAgIGlmICh0aGlzLmNoYXJnaW5nU2hpcFdlYXBvbikge1xyXG4gICAgICAgICAgICB3ZWFwb24gPSB0aGlzLnNoaXAuZ2V0SXRlbUJ5SUQodGhpcy5jaGFyZ2luZ1NoaXBXZWFwb24ud2VhcG9uSUQpO1xyXG4gICAgICAgICAgICB3ZWFwb24uY2hhcmdlZEJ5ID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5jaGFyZ2luZ1NoaXBXZWFwb24gPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEFsbCB0aGUgZGlmZmVyZW50IHR5cGVzIG9mIHVuaXRzLlxyXG4gKi9cclxuc2gudW5pdHMgPSAoZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICB2YXIgdSA9IHt9O1xyXG4gICAgdS5aZWFsb3QgPSBzaC5Vbml0LmV4dGVuZFNoYXJlZCh7XHJcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oanNvbikge1xyXG4gICAgICAgICAgICB0aGlzLmltZ0luZGV4ID0gMDtcclxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IDI7XHJcbiAgICAgICAgICAgIHRoaXMubWF4SFAgPSAxMDA7XHJcbiAgICAgICAgICAgIHRoaXMuYXR0YWNrQ29vbGRvd24gPSA4MDA7XHJcbiAgICAgICAgICAgIHRoaXMubWVsZWVEYW1hZ2UgPSAyMDtcclxuICAgICAgICAgICAgdGhpcy5hdHRhY2tSYW5nZSA9IDM7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50KGpzb24pO1xyXG4gICAgICAgICAgICB0aGlzLnNldEpzb24oe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ1plYWxvdCcsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBnZXRBdHRhY2tBY3Rpb25zOiBmdW5jdGlvbih0dXJuVGltZSwgYmF0dGxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBfLm1hcCh0aGlzLnBhcmVudCh0dXJuVGltZSwgYmF0dGxlKSwgZnVuY3Rpb24oYWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb24uZGFtYWdlRGVsYXkgPSAzMDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHUuQ3JpdHRlciA9IHNoLlVuaXQuZXh0ZW5kU2hhcmVkKHtcclxuICAgICAgICBpbml0OiBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW1nSW5kZXggPSA1O1xyXG4gICAgICAgICAgICB0aGlzLnNwZWVkID0gMTtcclxuICAgICAgICAgICAgdGhpcy5tYXhIUCA9IDUwO1xyXG4gICAgICAgICAgICB0aGlzLmF0dGFja0Nvb2xkb3duID0gNDIwO1xyXG4gICAgICAgICAgICB0aGlzLm1lbGVlRGFtYWdlID0gODtcclxuICAgICAgICAgICAgdGhpcy5pbWFnZUZhY2VzUmlnaHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnQ3JpdHRlcicsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGpzb246IGpzb25cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB1Lk1ldGFsU3BpZGVyID0gc2guVW5pdC5leHRlbmRTaGFyZWQoe1xyXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKGpzb24pIHtcclxuICAgICAgICAgICAgdGhpcy5pbWdJbmRleCA9IDI4O1xyXG4gICAgICAgICAgICB0aGlzLnNwZWVkID0gMztcclxuICAgICAgICAgICAgdGhpcy5tYXhIUCA9IDE2MDtcclxuICAgICAgICAgICAgdGhpcy5hdHRhY2tDb29sZG93biA9IDE1MDA7XHJcbiAgICAgICAgICAgIHRoaXMubWVsZWVEYW1hZ2UgPSAyNTtcclxuICAgICAgICAgICAgdGhpcy5pbWFnZUZhY2VzUmlnaHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnQoanNvbik7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0SnNvbih7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnTWV0YWxTcGlkZXInLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogW10sXHJcbiAgICAgICAgICAgICAgICBqc29uOiBqc29uXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHU7XHJcbn0oKSk7XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKi9cclxuXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzLFxyXG4gICAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKS5fLFxyXG4gICAgU2NyaXB0ID0gcmVxdWlyZSgnLi9jbGFzc2VzL3NjcmlwdCcpLlNjcmlwdCxcclxuICAgIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLnV0aWxzLFxyXG4gICAgTW9kZWxDaGFuZ2UgPSByZXF1aXJlKCcuL2NsYXNzZXMvYWN0aW9ucycpLk1vZGVsQ2hhbmdlO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdmFyIG1heExvb3BzQXRTYW1lVGltZSA9IDUwMDsvL3RvIHByZXZlbnQgZW5kbGVzcyBsb29wcy5cclxuICAgIGZ1bmN0aW9uIGluc2VydEJ5VGltZShhcnJheSwgaXRlbSkge1xyXG4gICAgICAgIHZhciBpbnNlcnRpb25JbmRleCA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0sICd0aW1lJyk7XHJcbiAgICAgICAgYXJyYXkuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCBpdGVtKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRWb2lkTW9kZWxDaGFuZ2UodGltZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgTW9kZWxDaGFuZ2UoMCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsOy8vZm9yIGpzbGludFxyXG4gICAgICAgIH0sIHt0aW1lOiB0aW1lfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZW5lcmF0ZXMgYSBcInNjcmlwdFwiIGZvciB0aGUgdW5pdHMgZ2l2ZW4gYWxsIHRoZSBvcmRlcnMgaXNzdWVkLlxyXG4gICAgICogQHBhcmFtIHtzaC5PcmRlckNvbGxlY3Rpb259IG9yZGVyQ29sbGVjdGlvblxyXG4gICAgICogQHBhcmFtIHtzaC5CYXR0bGV9IGJhdHRsZVxyXG4gICAgICogQHBhcmFtIHtCb29sZWFufSByZXNldEJhdHRsZSBTaG91bGQgdGhlIGJhdHRsZSBiZSBjbGVhbmVkIHVwIGF0IHRoZSBlbmQuXHJcbiAgICAgKiBAcmV0dXJuIHtzaC5TY3JpcHR9XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZVNjcmlwdChvcmRlckNvbGxlY3Rpb24sIGJhdHRsZSwgcmVzZXRCYXR0bGUpIHtcclxuICAgICAgICB2YXIgc2NyaXB0LCBxdWV1ZSwgY2hhbmdlcywgdGltZSwgYWN0b3JzLCBhY3RvciwgaSxcclxuICAgICAgICAgICAgcmVnaXN0ZXJBY3Rpb25SZXR1cm5lZCA9IHt9LCB0dXJuRHVyYXRpb24gPSBiYXR0bGUudHVybkR1cmF0aW9uLFxyXG4gICAgICAgICAgICBjaGFuZ2VzQXRTYW1lVGltZSA9IFtdO1xyXG4gICAgICAgIHNjcmlwdCA9IG5ldyBTY3JpcHQoe3R1cm5EdXJhdGlvbjogdHVybkR1cmF0aW9ufSk7XHJcbiAgICAgICAgcXVldWUgPSBbXTtcclxuICAgICAgICBmdW5jdGlvbiBpbnNlcnRJblF1ZXVlKGl0ZW0pIHtcclxuICAgICAgICAgICAgaW5zZXJ0QnlUaW1lKHF1ZXVlLCBpdGVtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHJlZ2lzdGVyQWN0aW9uKHJldHVybmVkLCB0aW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbi50aW1lID0gdGltZTtcclxuICAgICAgICAgICAgICAgIGFjdGlvbi51cGRhdGVNb2RlbENoYW5nZXMoKTtcclxuICAgICAgICAgICAgICAgIHNjcmlwdC5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIF8uZWFjaChhY3Rpb24ubW9kZWxDaGFuZ2VzLCBmdW5jdGlvbihtYywgaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWMudGltZSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9BZGQgYWN0aW9uSW5kZXggYW5kIGluZGV4IHVzZWQgYnkgc2NyaXB0LnJlZ2lzdGVyQ2hhbmdlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1jLmFjdGlvbkluZGV4ID0gc2NyaXB0LmFjdGlvbnMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWMuaW5kZXggPSBpbmRleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1jLnRpbWUgPT09IGFjdGlvbi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2FwcGx5IGltbWVkaWF0ZSBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYy5hcHBseShiYXR0bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0LnJlZ2lzdGVyQ2hhbmdlKG1jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybmVkLmltbWVkaWF0ZUNoYW5nZXMucHVzaChhY3Rpb24udG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRJblF1ZXVlKG1jKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXQgdGhlIG9yZGVycyB0byB0aGUgdW5pdHNcclxuICAgICAgICBiYXR0bGUuaW5zZXJ0T3JkZXJzKG9yZGVyQ29sbGVjdGlvbik7XHJcblxyXG4gICAgICAgIC8vbnVsbCBjaGFuZ2UgdG8ga2ljay1zdGFydCB0aGUgcHJvY2Vzc1xyXG4gICAgICAgIHF1ZXVlLnB1c2goZ2V0Vm9pZE1vZGVsQ2hhbmdlKDApKTtcclxuXHJcbiAgICAgICAgXy5lYWNoKGJhdHRsZS5wZW5kaW5nQWN0aW9ucywgZnVuY3Rpb24oYWN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJlZ2lzdGVyQWN0aW9uKHt9LCBhY3Rpb24udGltZSAtIHR1cm5EdXJhdGlvbikoYWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9zaW11bGF0aW9uIGxvb3AgKHRoZSBiYXR0bGUgZ2V0cyBtb2RpZmllZCBhbmQgYWN0aW9ucyBnZXQgYWRkZWRcclxuICAgICAgICAvLyB0byB0aGUgc2NyaXB0IG92ZXIgdGltZSlcclxuICAgICAgICB3aGlsZSAocXVldWUubGVuZ3RoID4gMCAmJiBxdWV1ZVswXS50aW1lIDw9IHR1cm5EdXJhdGlvbikge1xyXG4gICAgICAgICAgICB0aW1lID0gcXVldWVbMF0udGltZTtcclxuICAgICAgICAgICAgY2hhbmdlcyA9IF8ud2hlcmUocXVldWUsIHt0aW1lOiB0aW1lfSk7XHJcbiAgICAgICAgICAgIF8uaW52b2tlKGNoYW5nZXMsICdhcHBseScsIGJhdHRsZSk7XHJcbiAgICAgICAgICAgIF8uZWFjaChjaGFuZ2VzLCBzY3JpcHQucmVnaXN0ZXJDaGFuZ2UsIHNjcmlwdCk7XHJcbiAgICAgICAgICAgIHF1ZXVlID0gcXVldWUuc2xpY2UoY2hhbmdlcy5sZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRpbWUgPCB0dXJuRHVyYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIC8vYWN0aW9ucyBjYW4ndCBzdGFydCBhdCBlbmQgb2YgdHVyblxyXG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJBY3Rpb25SZXR1cm5lZC5pbW1lZGlhdGVDaGFuZ2VzID0gW107XHJcbiAgICAgICAgICAgICAgICBhY3RvcnMgPSBiYXR0bGUuZ2V0QWN0b3JzKCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWN0b3JzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0b3IgPSBhY3RvcnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGFjdG9yLmdldEFjdGlvbnModGltZSwgYmF0dGxlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJBY3Rpb24ocmVnaXN0ZXJBY3Rpb25SZXR1cm5lZCwgdGltZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlZ2lzdGVyQWN0aW9uUmV0dXJuZWQuaW1tZWRpYXRlQ2hhbmdlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9JZiBhbnkgYWN0b3IgcmV0dXJuZWQgYW55IGFjdGlvbiB3aXRoIGltbWVkaWF0ZSBtb2RlbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vY2hhbmdlcywgdGhlIGxvb3AgZW50ZXJzIGFnYWluIGF0IHRoZSBzYW1lIHRpbWUuXHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlc0F0U2FtZVRpbWUucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVnaXN0ZXJBY3Rpb25SZXR1cm5lZC5pbW1lZGlhdGVDaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlc0F0U2FtZVRpbWUubGVuZ3RoID49IG1heExvb3BzQXRTYW1lVGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyAnVG9vIG11Y2ggbW9kZWwgY2hhbmdlcyBhdCB0aGUgc2FtZSB0aW1lICgnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWUgKyAnbXMpLiBDaGFuZ2VzIHN0YWNrOiAnICsgY2hhbmdlc0F0U2FtZVRpbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zbGljZShjaGFuZ2VzQXRTYW1lVGltZS5sZW5ndGggLSAxMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzQXRTYW1lVGltZS5sZW5ndGggLSAxKS50b1N0cmluZygpICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgLi4uJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0SW5RdWV1ZShnZXRWb2lkTW9kZWxDaGFuZ2UodGltZSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzQXRTYW1lVGltZSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBiYXR0bGUucGVuZGluZ0FjdGlvbnMgPSBfLmNoYWluKHF1ZXVlKVxyXG4gICAgICAgICAgICAucGx1Y2soJ2FjdGlvbicpXHJcbiAgICAgICAgICAgIC51bmlxKClcclxuICAgICAgICAgICAgLnZhbHVlKCk7XHJcbiAgICAgICAgc2NyaXB0LnBlbmRpbmdBY3Rpb25zSnNvbiA9IHV0aWxzLm1hcFRvSnNvbihiYXR0bGUucGVuZGluZ0FjdGlvbnMpO1xyXG5cclxuICAgICAgICAvL2NsZWFuIHVwXHJcbiAgICAgICAgaWYgKHJlc2V0QmF0dGxlKSB7XHJcbiAgICAgICAgICAgIGJhdHRsZS5lbmRPZlR1cm5SZXNldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2NyaXB0O1xyXG4gICAgfVxyXG5cclxuICAgIC8vZXhwb3J0XHJcbiAgICBzaC5jcmVhdGVTY3JpcHQgPSBjcmVhdGVTY3JpcHQ7XHJcbn0oKSk7XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKi9cclxuXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZ3JpZCBnZXRzIHN1YmRpdmlkZWQgaW4gaXRzIHdpZHRoIGFuZCBpdHMgaGVpZ2h0IGFjY29yZGluZyB0byB0aGlzXHJcbiAgICAgKiBjb25zdGFudC5cclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNoLkdSSURfU1VCID0gMjtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWZWN0b3IgbWF0aC5cclxuICAgICAqIEB0eXBlIHt7c3ViOiBGdW5jdGlvbiwgYWRkOiBGdW5jdGlvbiwgbXVsOiBGdW5jdGlvbiwgZGl2OiBGdW5jdGlvbiwgZXF1YWw6IEZ1bmN0aW9ufX1cclxuICAgICAqL1xyXG4gICAgc2gudiA9IHtcclxuICAgICAgICBzdWI6IGZ1bmN0aW9uKHYxLCB2Mikge1xyXG4gICAgICAgICAgICByZXR1cm4geyB4OiB2MS54IC0gdjIueCwgeTogdjEueSAtIHYyLnkgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFkZDogZnVuY3Rpb24odjEsIHYyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHg6IHYxLnggKyB2Mi54LCB5OiB2MS55ICsgdjIueSB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbXVsOiBmdW5jdGlvbih2LCBzY2FsYXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgeDogdi54ICogc2NhbGFyLCB5OiB2LnkgKiBzY2FsYXJ9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGl2OiBmdW5jdGlvbih2LCBzY2FsYXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHsgeDogdi54IC8gc2NhbGFyLCB5OiB2LnkgLyBzY2FsYXJ9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXF1YWw6IGZ1bmN0aW9uKHYxLCB2Mikge1xyXG4gICAgICAgICAgICBpZiAoIXYxIHx8ICF2Mikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB2MS54ID09PSB2Mi54ICYmIHYxLnkgPT09IHYyLnk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBtYXA6IGZ1bmN0aW9uKHYsIGZ1bikge1xyXG4gICAgICAgICAgICByZXR1cm4ge3g6IGZ1bih2LngpLCB5OiBmdW4odi55KX07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdHI6IGZ1bmN0aW9uKHYpIHtcclxuICAgICAgICAgICAgcmV0dXJuICcoJyArIHYueCArICcsICcgKyB2LnkgKyAnKSc7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkaXN0YW5jZTogZnVuY3Rpb24odjEsIHYyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3codjIueCAtIHYxLngsIDIpICtcclxuICAgICAgICAgICAgICAgIE1hdGgucG93KHYyLnkgLSB2MS55LCAyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBzaC50aWxlcyA9IHtcclxuICAgICAgICBzb2xpZDogJ3MnLFxyXG4gICAgICAgIGZyb250OiAnZicsXHJcbiAgICAgICAgYmFjazogJ2InLFxyXG4gICAgICAgIGNsZWFyOiAnLidcclxuICAgIH07XHJcblxyXG4gICAgc2gubWFwTmFtZXMgPSBbXHJcbiAgICAgICAgJ3Rlc3QnLFxyXG4gICAgICAgICdjeWJvcmdfYmF0dGxlc2hpcDEnLFxyXG4gICAgICAgICdjeWJvcmdfY3J1aXNlcicsXHJcbiAgICAgICAgJ2N5Ym9yZ19kcm9uZScsXHJcbiAgICAgICAgJ2N5Ym9yZ19mcmlnYXRlJyxcclxuICAgICAgICAnaHVtYW5vaWRfYmF0dGxlc2hpcCcsXHJcbiAgICAgICAgJ2h1bWFub2lkX2NydWlzZXInLFxyXG4gICAgICAgICdodW1hbm9pZF9kcm9uZScsXHJcbiAgICAgICAgJ2h1bWFub2lkX2ZyaWdhdGUnLFxyXG4gICAgICAgICdsaXF1aWRfYmF0dGxlc2hpcCcsXHJcbiAgICAgICAgJ2xpcXVpZF9jcnVpc2VyJyxcclxuICAgICAgICAnbGlxdWlkX2Ryb25lJyxcclxuICAgICAgICAnbGlxdWlkX2ZyaWdhdGUnLFxyXG4gICAgICAgICdtZWNoYW5vaWRfYmF0dGxlc2hpcCcsXHJcbiAgICAgICAgJ21lY2hhbm9pZF9jcnVpc2VyJyxcclxuICAgICAgICAnbWVjaGFub2lkX2Ryb25lJyxcclxuICAgICAgICAnbWVjaGFub2lkX2ZyaWdhdGUnXHJcbiAgICBdO1xyXG5cclxuICAgIC8vT2JqZWN0IGhvbGRpbmcgcmVmZXJlbmNlcyB0byBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIHRlc3RlZC5cclxuICAgIHNoLmZvclRlc3RpbmcgPSB7fTtcclxuXHJcbiAgICAvL3VzZWQgaW4gdGVzdGluZ1xyXG4gICAgc2guZ2V0UHJvcGVydGllcyA9IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICAgIHZhciBwcm9wcyA9IFtdLCBwO1xyXG4gICAgICAgIGZvciAocCBpbiBvYmplY3QpIHtcclxuICAgICAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShwKSkge1xyXG4gICAgICAgICAgICAgICAgcHJvcHMucHVzaChwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHJvcHM7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuIiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCByZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUqL1xyXG5cclxudmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJykuXyxcclxuICAgIHNoID0ge307XHJcblxyXG5zaC5QRiA9IHJlcXVpcmUoJ3BhdGhmaW5kaW5nJyk7XHJcbm1vZHVsZS5leHBvcnRzID0gXy5leHRlbmQoc2gsXHJcbiAgICByZXF1aXJlKCcuL2dlbmVyYWwtc3R1ZmYnKSxcclxuICAgIHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICAgIHJlcXVpcmUoJy4vcGxhY2VtZW50LXJ1bGVzJyksXHJcbiAgICByZXF1aXJlKCcuL2NsYXNzZXMvc2hhcmVkLWNsYXNzJyksXHJcbiAgICByZXF1aXJlKCcuL2NsYXNzZXMvanNvbmFibGUnKSxcclxuICAgIHJlcXVpcmUoJy4vY2xhc3Nlcy9wbGF5ZXInKSxcclxuICAgIHJlcXVpcmUoJy4vY2xhc3Nlcy90aWxlLWVudGl0eScpLFxyXG4gICAgcmVxdWlyZSgnLi9jbGFzc2VzL2l0ZW1zJyksXHJcbiAgICByZXF1aXJlKCcuL2NsYXNzZXMvdW5pdHMnKSxcclxuICAgIHJlcXVpcmUoJy4vY2xhc3Nlcy9tYXAnKSxcclxuICAgIHJlcXVpcmUoJy4vY2xhc3Nlcy9zaGlwJyksXHJcbiAgICByZXF1aXJlKCcuL2NsYXNzZXMvYmF0dGxlJyksXHJcbiAgICByZXF1aXJlKCcuL2NsYXNzZXMvYWN0aW9ucycpLFxyXG4gICAgcmVxdWlyZSgnLi9jbGFzc2VzL29yZGVycycpLFxyXG4gICAgcmVxdWlyZSgnLi9jbGFzc2VzL3NjcmlwdCcpLFxyXG4gICAgcmVxdWlyZSgnLi9jcmVhdGUtc2NyaXB0JylcclxuICAgICk7IiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG4vKmdsb2JhbCByZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUqL1xyXG5cclxudmFyIHNoID0gbW9kdWxlLmV4cG9ydHMsXHJcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLl8sXHJcbiAgICBNYXAgPSByZXF1aXJlKCcuL2NsYXNzZXMvbWFwJykuTWFwLFxyXG4gICAgZ2VuID0gcmVxdWlyZSgnLi9nZW5lcmFsLXN0dWZmJyksXHJcbiAgICB0aWxlcyA9IGdlbi50aWxlcyxcclxuICAgIEdSSURfU1VCID0gZ2VuLkdSSURfU1VCO1xyXG5cclxuLyoqXHJcbiAqIExpYnJhcnkgZm9yIGZhY2lsaXRhdGluZyBjb25maWd1cmluZyB0aGUgcnVsZXMgZm9yIHBsYWNlbWVudCBmb3IgdGhlIGl0ZW1zLlxyXG4gKiBAdHlwZSB7e1BsYWNlbWVudFJ1bGU6IEZ1bmN0aW9uLCBtYWtlOiB7c3BhY2VSdWxlOiBGdW5jdGlvbiwgbmV4dFRvUnVsZTogRnVuY3Rpb259LCB1dGlsczoge2NoZWNrQW55OiBGdW5jdGlvbiwgY2hlY2tBbGw6IEZ1bmN0aW9uLCBjaGVja0FueU9yQWxsOiBGdW5jdGlvbn19fVxyXG4gKi9cclxuc2gucHIgPSB7XHJcbiAgICAvKipcclxuICAgICAqIEEgcGxhY2VtZW50IHJ1bGVcclxuICAgICAqIEBwYXJhbSB7e3RpbGU6e09iamVjdH0sIGluQW55OntBcnJheX0sIGluQWxsOntBcnJheX19fSBzZXR0aW5nc1xyXG4gICAgICogQGNvbnN0cnVjdG9yXHJcbiAgICAgKi9cclxuICAgIFBsYWNlbWVudFJ1bGU6IGZ1bmN0aW9uKHNldHRpbmdzKSB7IC8vc2V0dGluZ3M6IHRpbGUsIGluQW55LCBpbkFsbFxyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgd2FudGVkVGlsZTtcclxuICAgICAgICAvL3N1Z2FyIGZvciB0aWxlU2F0aXNmaWVzID0gZnVuY3Rpb24odGlsZSl7cmV0dXJuIHRpbGUgPT0gPHRpbGU+O31cclxuICAgICAgICB0aGlzLnRpbGUgPSBzZXR0aW5ncy50aWxlO1xyXG4gICAgICAgIHRoaXMuaW5BbnkgPSBzZXR0aW5ncy5pbkFueTsvLyBBcnJheSBvZiB7eCx5fSAocmVsYXRpdmUgY29vcmRpbmF0ZXMpXHJcbiAgICAgICAgdGhpcy5pbkFsbCA9IHNldHRpbmdzLmluQWxsOy8vIEFycmF5IG9mIHt4LHl9IChyZWxhdGl2ZSBjb29yZGluYXRlcylcclxuICAgICAgICB0aGlzLnRpbGVDb25kaXRpb24gPSBzZXR0aW5ncy50aWxlQ29uZGl0aW9uOyAvLyBmdW5jdGlvbih0aWxlKVxyXG4gICAgICAgIGlmICh0aGlzLnRpbGVDb25kaXRpb24gPT09IHVuZGVmaW5lZCAmJiB0aGlzLnRpbGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB3YW50ZWRUaWxlID0gdGhpcy50aWxlO1xyXG4gICAgICAgICAgICB0aGlzLnRpbGVDb25kaXRpb24gPSBmdW5jdGlvbih0aWxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGlsZSA9PT0gd2FudGVkVGlsZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb21wbGllc0F0ID0gZnVuY3Rpb24oeCwgeSwgbWFwKSB7XHJcbiAgICAgICAgICAgIGlmICghKG1hcCBpbnN0YW5jZW9mIE1hcCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdtYXAgc2hvdWxkIGJlIGFuIGluc3RhbmNlIG9mIHNoLk1hcCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNoLnByLnV0aWxzLmNoZWNrQW55KG1hcCwgdGhpcy50aWxlQ29uZGl0aW9uLCB0aGlzLmluQW55LCB7XHJcbiAgICAgICAgICAgICAgICB4OiB4LFxyXG4gICAgICAgICAgICAgICAgeTogeVxyXG4gICAgICAgICAgICB9KSAmJiBzaC5wci51dGlscy5jaGVja0FsbChtYXAsIHRoaXMudGlsZUNvbmRpdGlvbiwgdGhpcy5pbkFsbCwge1xyXG4gICAgICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgICAgIHk6IHlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbiAgICBtYWtlOiB7XHJcbiAgICAgICAgLy9oYXMgdG8gaGF2ZSBlbm91Z2ggc3BhY2VcclxuICAgICAgICBzcGFjZVJ1bGU6IGZ1bmN0aW9uKHRpbGVDb25kaXRpb24sIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgICAgICB2YXIgY29vcmRBcnJheSA9IFtdLCB4LCB5LCBzZXR0aW5ncztcclxuICAgICAgICAgICAgZm9yICh5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvb3JkQXJyYXkucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHlcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IHtcclxuICAgICAgICAgICAgICAgIGluQWxsOiBjb29yZEFycmF5XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odGlsZUNvbmRpdGlvbikpIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnRpbGVDb25kaXRpb24gPSB0aWxlQ29uZGl0aW9uO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudGlsZSA9IHRpbGVDb25kaXRpb247IC8vdGlsZUNvbmRpdGlvbiBpcyBqdXN0IGEgdGlsZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgc2gucHIuUGxhY2VtZW50UnVsZShzZXR0aW5ncyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL2hhcyB0byBiZSBuZXh0IHRvIHNvbWV0aGluZ1xyXG4gICAgICAgIG5leHRUb1J1bGU6IGZ1bmN0aW9uKHRpbGVDb25kaXRpb24sIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgICAgICB2YXIgY29vcmRBcnJheSA9IFtdLCB4LCB5LCBzZXR0aW5ncztcclxuICAgICAgICAgICAgZm9yICh4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgICAgIGNvb3JkQXJyYXkucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgICAgICAgICB5OiAtMVxyXG4gICAgICAgICAgICAgICAgfSk7IC8vdG9wXHJcbiAgICAgICAgICAgICAgICBjb29yZEFycmF5LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB9KTsgLy9ib3R0b21cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICAgICAgICAgIGNvb3JkQXJyYXkucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgeDogLTEsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogeVxyXG4gICAgICAgICAgICAgICAgfSk7IC8vbGVmdFxyXG4gICAgICAgICAgICAgICAgY29vcmRBcnJheS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB4OiB3aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICB5OiB5XHJcbiAgICAgICAgICAgICAgICB9KTsgLy9yaWdodFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICAgICAgaW5Bbnk6IGNvb3JkQXJyYXlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaWYgKF8uaXNGdW5jdGlvbih0aWxlQ29uZGl0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MudGlsZUNvbmRpdGlvbiA9IHRpbGVDb25kaXRpb247XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy50aWxlID0gdGlsZUNvbmRpdGlvbjsgLy90aWxlQ29uZGl0aW9uIGlzIGp1c3QgYSB0aWxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBzaC5wci5QbGFjZW1lbnRSdWxlKHNldHRpbmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgdXRpbHM6IHtcclxuICAgICAgICAvL2NoZWNrIGlmIGEgdGlsZSBpcyBhdCBhbnkgb2YgdGhlIHBvc2l0aW9ucyBpbiBcInJlbGF0aXZlQ29vcmRzXCJcclxuICAgICAgICBjaGVja0FueTogZnVuY3Rpb24odGlsZU1hcCwgY29uZGl0aW9uLCByZWxhdGl2ZUNvb3JkcywgY3VycmVudENvb3JkKSB7XHJcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICAgICAgcmV0dXJuIHNoLnByLnV0aWxzLmNoZWNrQW55T3JBbGwodGlsZU1hcCwgY29uZGl0aW9uLCByZWxhdGl2ZUNvb3JkcyxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRDb29yZCwgdHJ1ZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvL2NoZWNrIGlmIGEgdGlsZSBpcyBhdCBhbGwgb2YgdGhlIHBvc2l0aW9ucyBpbiBcInJlbGF0aXZlQ29vcmRzXCJcclxuICAgICAgICBjaGVja0FsbDogZnVuY3Rpb24odGlsZU1hcCwgY29uZGl0aW9uLCByZWxhdGl2ZUNvb3JkcywgY3VycmVudENvb3JkKSB7XHJcbiAgICAgICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICAgICAgcmV0dXJuIHNoLnByLnV0aWxzLmNoZWNrQW55T3JBbGwodGlsZU1hcCwgY29uZGl0aW9uLCByZWxhdGl2ZUNvb3JkcyxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRDb29yZCwgZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2hlY2tBbnlPckFsbDogZnVuY3Rpb24odGlsZU1hcCwgdGlsZUNvbmRpdGlvbiwgcmVsYXRpdmVDb29yZGluYXRlcyxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRDb29yZCwgaW5BbnkpIHtcclxuICAgICAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgICAgICB2YXIgY29vciwgd2FudGVkVGlsZUNvb3JkLCB0aWxlQXRDb29yZDtcclxuICAgICAgICAgICAgaWYgKCFyZWxhdGl2ZUNvb3JkaW5hdGVzIHx8IHJlbGF0aXZlQ29vcmRpbmF0ZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGNvb3IgPSAwOyBjb29yIDwgcmVsYXRpdmVDb29yZGluYXRlcy5sZW5ndGg7IGNvb3IrKykge1xyXG4gICAgICAgICAgICAgICAgd2FudGVkVGlsZUNvb3JkID0gcmVsYXRpdmVDb29yZGluYXRlc1tjb29yXTtcclxuICAgICAgICAgICAgICAgIHRpbGVBdENvb3JkID0gdGlsZU1hcC5hdChjdXJyZW50Q29vcmQueCArIHdhbnRlZFRpbGVDb29yZC54LFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDb29yZC55ICsgd2FudGVkVGlsZUNvb3JkLnkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGluQW55ICYmIHRpbGVBdENvb3JkICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbGVDb25kaXRpb24odGlsZUF0Q29vcmQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWluQW55ICYmICghdGlsZUF0Q29vcmQgfHxcclxuICAgICAgICAgICAgICAgICAgICAhdGlsZUNvbmRpdGlvbih0aWxlQXRDb29yZCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAhaW5Bbnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxufTtcclxuXHJcbi8vYWRkIHByZWJ1aWx0IHBsYWNlbWVudCBydWxlcyBmb3IgaXRlbXNcclxuKGZ1bmN0aW9uKCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgZnVuY3Rpb24gcyh2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZSAqIEdSSURfU1VCO1xyXG4gICAgfVxyXG4gICAgdmFyIHByID0gc2gucHIsXHJcbiAgICAgICAgc3BhY2UxeDEgPSBwci5tYWtlLnNwYWNlUnVsZSh0aWxlcy5jbGVhciwgcygxKSwgcygxKSksXHJcbiAgICAgICAgc3BhY2UyeDEgPSBwci5tYWtlLnNwYWNlUnVsZSh0aWxlcy5jbGVhciwgcygyKSwgcygxKSksXHJcbiAgICAgICAgc3BhY2UxeDIgPSBwci5tYWtlLnNwYWNlUnVsZSh0aWxlcy5jbGVhciwgcygxKSwgcygyKSksXHJcbiAgICAgICAgc3BhY2UyeDIgPSBwci5tYWtlLnNwYWNlUnVsZSh0aWxlcy5jbGVhciwgcygyKSwgcygyKSk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5kKHJ1bGVBLCBydWxlQikge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNvbXBsaWVzQXQ6IGZ1bmN0aW9uKHgsIHksIG1hcCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bGVBLmNvbXBsaWVzQXQoeCwgeSwgbWFwKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHJ1bGVCLmNvbXBsaWVzQXQoeCwgeSwgbWFwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBvcihydWxlQSwgcnVsZUIpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjb21wbGllc0F0OiBmdW5jdGlvbih4LCB5LCBtYXApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBydWxlQS5jb21wbGllc0F0KHgsIHksIG1hcCkgfHxcclxuICAgICAgICAgICAgICAgICAgICBydWxlQi5jb21wbGllc0F0KHgsIHksIG1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vU1BFQ0lBTCBQTEFDRU1FTlQgUlVMRVMgRk9SIElURU1TXHJcblxyXG4gICAgcHIud2VhcG9uID0gYW5kKHNwYWNlMngyLCBuZXcgc2gucHIuUGxhY2VtZW50UnVsZSh7XHJcbiAgICAgICAgdGlsZTogdGlsZXMuZnJvbnQsXHJcbiAgICAgICAgaW5Bbnk6IFt7XHJcbiAgICAgICAgICAgIHg6IHMoMiksXHJcbiAgICAgICAgICAgIHk6IHMoMClcclxuICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgIHg6IHMoMiksXHJcbiAgICAgICAgICAgIHk6IHMoMSlcclxuICAgICAgICB9XVxyXG4gICAgfSkpO1xyXG5cclxuICAgIHByLkVuZ2luZSA9IGFuZChzcGFjZTJ4MiwgbmV3IHNoLnByLlBsYWNlbWVudFJ1bGUoe1xyXG4gICAgICAgIHRpbGU6IHRpbGVzLmJhY2ssXHJcbiAgICAgICAgaW5BbGw6IFt7XHJcbiAgICAgICAgICAgIHg6IHMoLTEpLFxyXG4gICAgICAgICAgICB5OiBzKDApXHJcbiAgICAgICAgfSwge1xyXG4gICAgICAgICAgICB4OiBzKC0xKSxcclxuICAgICAgICAgICAgeTogcygxKVxyXG4gICAgICAgIH1dXHJcbiAgICB9KSk7XHJcblxyXG4gICAgcHIuY29uc29sZSA9IGFuZChzcGFjZTF4MSwgc2gucHIubWFrZS5uZXh0VG9SdWxlKGZ1bmN0aW9uKHRpbGUpIHtcclxuICAgICAgICByZXR1cm4gdGlsZS50eXBlID09PSAnV2VhcG9uJyB8fCB0aWxlLnR5cGUgPT09ICdFbmdpbmUnIHx8XHJcbiAgICAgICAgICAgIHRpbGUudHlwZSA9PT0gJ1Bvd2VyJztcclxuICAgIH0sIHMoMSksIHMoMSkpKTtcclxuXHJcbiAgICBwci5kb29yID0gb3IocHIubWFrZS5zcGFjZVJ1bGUoZnVuY3Rpb24odGlsZSkge1xyXG4gICAgICAgIHJldHVybiB0aWxlLnR5cGUgPT09ICdXYWxsJyAmJiB0aWxlLmlzSG9yaXpvbnRhbCgpO1xyXG4gICAgfSwgcygyKSwgcygxKSksXHJcbiAgICAgICAgLy9vci4uLlxyXG4gICAgICAgIGFuZChzcGFjZTJ4MSxcclxuICAgICAgICAgICAgLy9hbmQuLi5cclxuICAgICAgICAgICAgbmV3IHByLlBsYWNlbWVudFJ1bGUoe3RpbGVDb25kaXRpb246IGZ1bmN0aW9uKHRpbGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aWxlLnR5cGUgPT09ICdXYWxsJztcclxuICAgICAgICAgICAgfSwgaW5BbGw6IFt7eDogcygtMSksIHk6IHMoMCl9LCB7eDogcygyKSwgeTogcygwKX1dfSkpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICBwci5kb29yUm90YXRlZCA9IG9yKHByLm1ha2Uuc3BhY2VSdWxlKGZ1bmN0aW9uKHRpbGUpIHtcclxuICAgICAgICByZXR1cm4gdGlsZS50eXBlID09PSAnV2FsbCcgJiYgdGlsZS5pc1ZlcnRpY2FsKCk7XHJcbiAgICB9LCBzKDEpLCBzKDIpKSxcclxuICAgICAgICBhbmQoc3BhY2UxeDIsXHJcbiAgICAgICAgICAgIG5ldyBwci5QbGFjZW1lbnRSdWxlKHt0aWxlQ29uZGl0aW9uOiBmdW5jdGlvbih0aWxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGlsZS50eXBlID09PSAnV2FsbCc7XHJcbiAgICAgICAgICAgIH0sIGluQWxsOiBbe3g6IHMoMCksIHk6IHMoLTEpfSwge3g6IHMoMCksIHk6IHMoMil9XX0pKSk7XHJcbn0oKSk7XHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKi9cclxuXHJcbnZhciBzaCA9IG1vZHVsZS5leHBvcnRzLFxyXG4gICAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKS5fO1xyXG5cclxuLyoqXHJcbiAqIFV0aWxpdGllc1xyXG4gKiBAdHlwZSB7e2dldEVtcHR5TWF0cml4OiBGdW5jdGlvbiwgbWF0cml4VGlsZXM6IEZ1bmN0aW9ufX1cclxuICogQHJldHVybiB7bnVsbH1cclxuICovXHJcbnNoLnV0aWxzID0ge1xyXG4gICAgZ2V0RW1wdHlNYXRyaXg6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGluaXRpYWxWYWx1ZSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgbWF0cml4ID0gW10sIGksIGo7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGhlaWdodDsgaSsrKSB7XHJcbiAgICAgICAgICAgIG1hdHJpeC5wdXNoKFtdKTtcclxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHdpZHRoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIG1hdHJpeFtpXS5wdXNoKGluaXRpYWxWYWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1hdHJpeDtcclxuICAgIH0sXHJcbiAgICAvL3VzZWZ1bCB3aGVuIHdhbnRpbmcgdG8gZG8gc29tZXRoaW5nIGF0IGV2ZXJ5IGNvb3JkaW5hdGUgb2YgYSBtYXRyaXhcclxuICAgIG1hdHJpeFRpbGVzOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBjYWxsYmFjaykgeyAvLyBjYWxsYmFjayh4LCB5KVxyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgeCwgeTtcclxuICAgICAgICBmb3IgKHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xyXG4gICAgICAgICAgICBmb3IgKHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHgsIHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNvbnZlcnRQb3NpdGlvbjogZnVuY3Rpb24ocG9zLCBmcm9tR3JpZFN1YiwgdG9HcmlkU3ViKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHBvcy54ID0gcG9zLnggKiAodG9HcmlkU3ViIC8gZnJvbUdyaWRTdWIpO1xyXG4gICAgICAgIHBvcy55ID0gcG9zLnkgKiAodG9HcmlkU3ViIC8gZnJvbUdyaWRTdWIpO1xyXG4gICAgfSxcclxuICAgIG1hcFRvSnNvbjogZnVuY3Rpb24oYXJyYXlPZk9iamVjdHMpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgcmV0dXJuIF8ubWFwKGFycmF5T2ZPYmplY3RzLCBmdW5jdGlvbihvKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBvLnRvSnNvbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG1hcEZyb21Kc29uOiBmdW5jdGlvbihhcnJheU9mSnNvbnMsIGNvbnN0cnVjdG9yQ29sbGVjdGlvbikge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICByZXR1cm4gXy5tYXAoYXJyYXlPZkpzb25zLCBmdW5jdGlvbihqc29uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgY29uc3RydWN0b3JDb2xsZWN0aW9uW2pzb24udHlwZV0oanNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlRnJvbUFycmF5OiBmdW5jdGlvbihpdGVtLCBhcnJheSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgaW5kZXggPSBhcnJheS5pbmRleE9mKGl0ZW0pO1xyXG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgIGFycmF5LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuIiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS43LjBcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjcuMCc7XG5cbiAgLy8gSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGVmZmljaWVudCAoZm9yIGN1cnJlbnQgZW5naW5lcykgdmVyc2lvblxuICAvLyBvZiB0aGUgcGFzc2VkLWluIGNhbGxiYWNrLCB0byBiZSByZXBlYXRlZGx5IGFwcGxpZWQgaW4gb3RoZXIgVW5kZXJzY29yZVxuICAvLyBmdW5jdGlvbnMuXG4gIHZhciBjcmVhdGVDYWxsYmFjayA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQsIGFyZ0NvdW50KSB7XG4gICAgaWYgKGNvbnRleHQgPT09IHZvaWQgMCkgcmV0dXJuIGZ1bmM7XG4gICAgc3dpdGNoIChhcmdDb3VudCA9PSBudWxsID8gMyA6IGFyZ0NvdW50KSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgb3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSwgb3RoZXIpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEEgbW9zdGx5LWludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGNhbGxiYWNrcyB0aGF0IGNhbiBiZSBhcHBsaWVkXG4gIC8vIHRvIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24sIHJldHVybmluZyB0aGUgZGVzaXJlZCByZXN1bHQg4oCUIGVpdGhlclxuICAvLyBpZGVudGl0eSwgYW4gYXJiaXRyYXJ5IGNhbGxiYWNrLCBhIHByb3BlcnR5IG1hdGNoZXIsIG9yIGEgcHJvcGVydHkgYWNjZXNzb3IuXG4gIF8uaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIF8uaWRlbnRpdHk7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZSkpIHJldHVybiBjcmVhdGVDYWxsYmFjayh2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpO1xuICAgIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkgcmV0dXJuIF8ubWF0Y2hlcyh2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucHJvcGVydHkodmFsdWUpO1xuICB9O1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgcmF3IG9iamVjdHMgaW4gYWRkaXRpb24gdG8gYXJyYXktbGlrZXMuIFRyZWF0cyBhbGxcbiAgLy8gc3BhcnNlIGFycmF5LWxpa2VzIGFzIGlmIHRoZXkgd2VyZSBkZW5zZS5cbiAgXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIG9iajtcbiAgICBpdGVyYXRlZSA9IGNyZWF0ZUNhbGxiYWNrKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgaSwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoID09PSArbGVuZ3RoKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2ldLCBpLCBvYmopO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRlZShvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRlZSB0byBlYWNoIGVsZW1lbnQuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIFtdO1xuICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSBvYmoubGVuZ3RoICE9PSArb2JqLmxlbmd0aCAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgIHJlc3VsdHMgPSBBcnJheShsZW5ndGgpLFxuICAgICAgICBjdXJyZW50S2V5O1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gaXRlcmF0ZWUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGl0ZXJhdGVlID0gY3JlYXRlQ2FsbGJhY2soaXRlcmF0ZWUsIGNvbnRleHQsIDQpO1xuICAgIHZhciBrZXlzID0gb2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICBpbmRleCA9IDAsIGN1cnJlbnRLZXk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICBpZiAoIWxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgICBtZW1vID0gb2JqW2tleXMgPyBrZXlzW2luZGV4KytdIDogaW5kZXgrK107XG4gICAgfVxuICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgbWVtbyA9IGl0ZXJhdGVlKG1lbW8sIG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgbWVtbywgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaXRlcmF0ZWUgPSBjcmVhdGVDYWxsYmFjayhpdGVyYXRlZSwgY29udGV4dCwgNCk7XG4gICAgdmFyIGtleXMgPSBvYmoubGVuZ3RoICE9PSArIG9iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGluZGV4ID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgIGN1cnJlbnRLZXk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICBpZiAoIWluZGV4KSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICAgIG1lbW8gPSBvYmpba2V5cyA/IGtleXNbLS1pbmRleF0gOiAtLWluZGV4XTtcbiAgICB9XG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIG1lbW8gPSBpdGVyYXRlZShtZW1vLCBvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgcHJlZGljYXRlID0gXy5pdGVyYXRlZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIF8uc29tZShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBwcmVkaWNhdGUgPSBfLml0ZXJhdGVlKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubmVnYXRlKF8uaXRlcmF0ZWUocHJlZGljYXRlKSksIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgcHJlZGljYXRlID0gXy5pdGVyYXRlZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gb2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICBpbmRleCwgY3VycmVudEtleTtcbiAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIGlmICghcHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIHByZWRpY2F0ZSA9IF8uaXRlcmF0ZWUocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9IG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgaW5kZXgsIGN1cnJlbnRLZXk7XG4gICAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAocHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAob2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGgpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgcmV0dXJuIF8uaW5kZXhPZihvYmosIHRhcmdldCkgPj0gMDtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgXy5wcm9wZXJ0eShrZXkpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgXy5tYXRjaGVzKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maW5kKG9iaiwgXy5tYXRjaGVzKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gLUluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSAtSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gb2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGggPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgaWYgKHZhbHVlID4gcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXRlcmF0ZWUgPSBfLml0ZXJhdGVlKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA+IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gLUluZmluaXR5ICYmIHJlc3VsdCA9PT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IEluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSBJbmZpbml0eSxcbiAgICAgICAgdmFsdWUsIGNvbXB1dGVkO1xuICAgIGlmIChpdGVyYXRlZSA9PSBudWxsICYmIG9iaiAhPSBudWxsKSB7XG4gICAgICBvYmogPSBvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICBpZiAodmFsdWUgPCByZXN1bHQpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgICAgaWYgKGNvbXB1dGVkIDwgbGFzdENvbXB1dGVkIHx8IGNvbXB1dGVkID09PSBJbmZpbml0eSAmJiByZXN1bHQgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYSBjb2xsZWN0aW9uLCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHNldCA9IG9iaiAmJiBvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IHNldC5sZW5ndGg7XG4gICAgdmFyIHNodWZmbGVkID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDAsIHJhbmQ7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oMCwgaW5kZXgpO1xuICAgICAgaWYgKHJhbmQgIT09IGluZGV4KSBzaHVmZmxlZFtpbmRleF0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gc2V0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYSBjb2xsZWN0aW9uLlxuICAvLyBJZiAqKm4qKiBpcyBub3Qgc3BlY2lmaWVkLCByZXR1cm5zIGEgc2luZ2xlIHJhbmRvbSBlbGVtZW50LlxuICAvLyBUaGUgaW50ZXJuYWwgYGd1YXJkYCBhcmd1bWVudCBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBtYXBgLlxuICBfLnNhbXBsZSA9IGZ1bmN0aW9uKG9iaiwgbiwgZ3VhcmQpIHtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSB7XG4gICAgICBpZiAob2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGgpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdGVlLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCB2YWx1ZSwga2V5KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIGlmIChfLmhhcyhyZXN1bHQsIGtleSkpIHJlc3VsdFtrZXldLnB1c2godmFsdWUpOyBlbHNlIHJlc3VsdFtrZXldID0gW3ZhbHVlXTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XSsrOyBlbHNlIHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCwgMSk7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0ZWUob2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IGxvdyArIGhpZ2ggPj4+IDE7XG4gICAgICBpZiAoaXRlcmF0ZWUoYXJyYXlbbWlkXSkgPCB2YWx1ZSkgbG93ID0gbWlkICsgMTsgZWxzZSBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiBvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gU3BsaXQgYSBjb2xsZWN0aW9uIGludG8gdHdvIGFycmF5czogb25lIHdob3NlIGVsZW1lbnRzIGFsbCBzYXRpc2Z5IHRoZSBnaXZlblxuICAvLyBwcmVkaWNhdGUsIGFuZCBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIGRvIG5vdCBzYXRpc2Z5IHRoZSBwcmVkaWNhdGUuXG4gIF8ucGFydGl0aW9uID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBfLml0ZXJhdGVlKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIHBhc3MgPSBbXSwgZmFpbCA9IFtdO1xuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iaikge1xuICAgICAgKHByZWRpY2F0ZSh2YWx1ZSwga2V5LCBvYmopID8gcGFzcyA6IGZhaWwpLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBbcGFzcywgZmFpbF07XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHJldHVybiBhcnJheVswXTtcbiAgICBpZiAobiA8IDApIHJldHVybiBbXTtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgTWF0aC5tYXgoMCwgYXJyYXkubGVuZ3RoIC0gKG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKSkpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqXG4gIC8vIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIHN0cmljdCwgb3V0cHV0KSB7XG4gICAgaWYgKHNoYWxsb3cgJiYgXy5ldmVyeShpbnB1dCwgXy5pc0FycmF5KSkge1xuICAgICAgcmV0dXJuIGNvbmNhdC5hcHBseShvdXRwdXQsIGlucHV0KTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGlucHV0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdmFsdWUgPSBpbnB1dFtpXTtcbiAgICAgIGlmICghXy5pc0FycmF5KHZhbHVlKSAmJiAhXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCFzdHJpY3QpIG91dHB1dC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2hhbGxvdykge1xuICAgICAgICBwdXNoLmFwcGx5KG91dHB1dCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgc3RyaWN0LCBvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgZmFsc2UsIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiBbXTtcbiAgICBpZiAoIV8uaXNCb29sZWFuKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdGVlO1xuICAgICAgaXRlcmF0ZWUgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpdGVyYXRlZSAhPSBudWxsKSBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaV07XG4gICAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgICAgaWYgKCFpIHx8IHNlZW4gIT09IHZhbHVlKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIHNlZW4gPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlcmF0ZWUpIHtcbiAgICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGksIGFycmF5KTtcbiAgICAgICAgaWYgKF8uaW5kZXhPZihzZWVuLCBjb21wdXRlZCkgPCAwKSB7XG4gICAgICAgICAgc2Vlbi5wdXNoKGNvbXB1dGVkKTtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pbmRleE9mKHJlc3VsdCwgdmFsdWUpIDwgMCkge1xuICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShmbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSwgW10pKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIFtdO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgYXJnc0xlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgICAgaWYgKF8uY29udGFpbnMocmVzdWx0LCBpdGVtKSkgY29udGludWU7XG4gICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGFyZ3NMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIV8uY29udGFpbnMoYXJndW1lbnRzW2pdLCBpdGVtKSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoaiA9PT0gYXJnc0xlbmd0aCkgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gZmxhdHRlbihzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIHRydWUsIHRydWUsIFtdKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gW107XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KGFyZ3VtZW50cywgJ2xlbmd0aCcpLmxlbmd0aDtcbiAgICB2YXIgcmVzdWx0cyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJndW1lbnRzLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuIGl0ZW0gaW4gYW4gYXJyYXksXG4gIC8vIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gXy5zb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpXSA9PT0gaXRlbSA/IGkgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmICh0eXBlb2YgZnJvbSA9PSAnbnVtYmVyJykge1xuICAgICAgaWR4ID0gZnJvbSA8IDAgPyBpZHggKyBmcm9tICsgMSA6IE1hdGgubWluKGlkeCwgZnJvbSArIDEpO1xuICAgIH1cbiAgICB3aGlsZSAoLS1pZHggPj0gMCkgaWYgKGFycmF5W2lkeF0gPT09IGl0ZW0pIHJldHVybiBpZHg7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBzdGVwIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciByYW5nZSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBsZW5ndGg7IGlkeCsrLCBzdGFydCArPSBzdGVwKSB7XG4gICAgICByYW5nZVtpZHhdID0gc3RhcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV1c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHByb3RvdHlwZSBzZXR0aW5nLlxuICB2YXIgQ3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB2YXIgYXJncywgYm91bmQ7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdCaW5kIG11c3QgYmUgY2FsbGVkIG9uIGEgZnVuY3Rpb24nKTtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIEN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgc2VsZiA9IG5ldyBDdG9yO1xuICAgICAgQ3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBpZiAoXy5pc09iamVjdChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgICByZXR1cm4gYm91bmQ7XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC4gXyBhY3RzXG4gIC8vIGFzIGEgcGxhY2Vob2xkZXIsIGFsbG93aW5nIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgdG8gYmUgcHJlLWZpbGxlZC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBib3VuZEFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvc2l0aW9uID0gMDtcbiAgICAgIHZhciBhcmdzID0gYm91bmRBcmdzLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gYXJncy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXJnc1tpXSA9PT0gXykgYXJnc1tpXSA9IGFyZ3VtZW50c1twb3NpdGlvbisrXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChwb3NpdGlvbiA8IGFyZ3VtZW50cy5sZW5ndGgpIGFyZ3MucHVzaChhcmd1bWVudHNbcG9zaXRpb24rK10pO1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGEgbnVtYmVyIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFJlbWFpbmluZyBhcmd1bWVudHNcbiAgLy8gYXJlIHRoZSBtZXRob2QgbmFtZXMgdG8gYmUgYm91bmQuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdCBhbGwgY2FsbGJhY2tzXG4gIC8vIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGksIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsIGtleTtcbiAgICBpZiAobGVuZ3RoIDw9IDEpIHRocm93IG5ldyBFcnJvcignYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lcycpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0gYXJndW1lbnRzW2ldO1xuICAgICAgb2JqW2tleV0gPSBfLmJpbmQob2JqW2tleV0sIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW9pemUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBjYWNoZSA9IG1lbW9pemUuY2FjaGU7XG4gICAgICB2YXIgYWRkcmVzcyA9IGhhc2hlciA/IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDoga2V5O1xuICAgICAgaWYgKCFfLmhhcyhjYWNoZSwgYWRkcmVzcykpIGNhY2hlW2FkZHJlc3NdID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGNhY2hlW2FkZHJlc3NdO1xuICAgIH07XG4gICAgbWVtb2l6ZS5jYWNoZSA9IHt9O1xuICAgIHJldHVybiBtZW1vaXplO1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICByZXR1cm4gXy5kZWxheS5hcHBseShfLCBbZnVuYywgMV0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IF8ubm93KCk7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBfLm5vdygpO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuXG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFzdCA9IF8ubm93KCkgLSB0aW1lc3RhbXA7XG5cbiAgICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID4gMCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBfLm5vdygpO1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gXy5wYXJ0aWFsKHdyYXBwZXIsIGZ1bmMpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBuZWdhdGVkIHZlcnNpb24gb2YgdGhlIHBhc3NlZC1pbiBwcmVkaWNhdGUuXG4gIF8ubmVnYXRlID0gZnVuY3Rpb24ocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICFwcmVkaWNhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgIHZhciBzdGFydCA9IGFyZ3MubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSA9IHN0YXJ0O1xuICAgICAgdmFyIHJlc3VsdCA9IGFyZ3Nbc3RhcnRdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB3aGlsZSAoaS0tKSByZXN1bHQgPSBhcmdzW2ldLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGJlZm9yZSBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5iZWZvcmUgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHZhciBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzID4gMCkge1xuICAgICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBfLnBhcnRpYWwoXy5iZWZvcmUsIDIpO1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gW107XG4gICAgaWYgKG5hdGl2ZUtleXMpIHJldHVybiBuYXRpdmVLZXlzKG9iaik7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgdmFyIHNvdXJjZSwgcHJvcDtcbiAgICBmb3IgKHZhciBpID0gMSwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwgcHJvcCkpIHtcbiAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0ge30sIGtleTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpdGVyYXRlZSkpIHtcbiAgICAgIGl0ZXJhdGVlID0gY3JlYXRlQ2FsbGJhY2soaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICBpZiAoaXRlcmF0ZWUodmFsdWUsIGtleSwgb2JqKSkgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoW10sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgICBvYmogPSBuZXcgT2JqZWN0KG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBpZiAoa2V5IGluIG9iaikgcmVzdWx0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGl0ZXJhdGVlKSkge1xuICAgICAgaXRlcmF0ZWUgPSBfLm5lZ2F0ZShpdGVyYXRlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5tYXAoY29uY2F0LmFwcGx5KFtdLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpLCBTdHJpbmcpO1xuICAgICAgaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHJldHVybiAhXy5jb250YWlucyhrZXlzLCBrZXkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIF8ucGljayhvYmosIGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgZm9yICh2YXIgaSA9IDEsIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChvYmpbcHJvcF0gPT09IHZvaWQgMCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCByZWd1bGFyIGV4cHJlc3Npb25zLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgZm9yIGNvbXBhcmlzb24gKE5vdGU6ICcnICsgL2EvaSA9PT0gJy9hL2knKVxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gJycgKyBhID09PSAnJyArIGI7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLlxuICAgICAgICAvLyBPYmplY3QoTmFOKSBpcyBlcXVpdmFsZW50IHRvIE5hTlxuICAgICAgICBpZiAoK2EgIT09ICthKSByZXR1cm4gK2IgIT09ICtiO1xuICAgICAgICAvLyBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gK2EgPT09IDAgPyAxIC8gK2EgPT09IDEgLyBiIDogK2EgPT09ICtiO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09PSArYjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKFxuICAgICAgYUN0b3IgIT09IGJDdG9yICYmXG4gICAgICAvLyBIYW5kbGUgT2JqZWN0LmNyZWF0ZSh4KSBjYXNlc1xuICAgICAgJ2NvbnN0cnVjdG9yJyBpbiBhICYmICdjb25zdHJ1Y3RvcicgaW4gYiAmJlxuICAgICAgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIGFDdG9yIGluc3RhbmNlb2YgYUN0b3IgJiZcbiAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiBiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUsIHJlc3VsdDtcbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoY2xhc3NOYW1lID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhhKSwga2V5O1xuICAgICAgc2l6ZSA9IGtleXMubGVuZ3RoO1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMgYmVmb3JlIGNvbXBhcmluZyBkZWVwIGVxdWFsaXR5LlxuICAgICAgcmVzdWx0ID0gXy5rZXlzKGIpLmxlbmd0aCA9PT0gc2l6ZTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlclxuICAgICAgICAgIGtleSA9IGtleXNbc2l6ZV07XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzQXJndW1lbnRzKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgXy5lYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnY2FsbGVlJyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS4gV29yayBhcm91bmQgYW4gSUUgMTEgYnVnLlxuICBpZiAodHlwZW9mIC8uLyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT0gJ2Z1bmN0aW9uJyB8fCBmYWxzZTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT09ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdGVlcy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIF8uY29uc3RhbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9O1xuXG4gIF8ubm9vcCA9IGZ1bmN0aW9uKCl7fTtcblxuICBfLnByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIHByZWRpY2F0ZSBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLm1hdGNoZXMgPSBmdW5jdGlvbihhdHRycykge1xuICAgIHZhciBwYWlycyA9IF8ucGFpcnMoYXR0cnMpLCBsZW5ndGggPSBwYWlycy5sZW5ndGg7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gIWxlbmd0aDtcbiAgICAgIG9iaiA9IG5ldyBPYmplY3Qob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBhaXIgPSBwYWlyc1tpXSwga2V5ID0gcGFpclswXTtcbiAgICAgICAgaWYgKHBhaXJbMV0gIT09IG9ialtrZXldIHx8ICEoa2V5IGluIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBpdGVyYXRlZSA9IGNyZWF0ZUNhbGxiYWNrKGl0ZXJhdGVlLCBjb250ZXh0LCAxKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRlZShpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gQSAocG9zc2libHkgZmFzdGVyKSB3YXkgdG8gZ2V0IHRoZSBjdXJyZW50IHRpbWVzdGFtcCBhcyBhbiBpbnRlZ2VyLlxuICBfLm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgfTtcblxuICAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnLFxuICAgICdgJzogJyYjeDYwOydcbiAgfTtcbiAgdmFyIHVuZXNjYXBlTWFwID0gXy5pbnZlcnQoZXNjYXBlTWFwKTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIHZhciBjcmVhdGVFc2NhcGVyID0gZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGVzY2FwZXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgcmV0dXJuIG1hcFttYXRjaF07XG4gICAgfTtcbiAgICAvLyBSZWdleGVzIGZvciBpZGVudGlmeWluZyBhIGtleSB0aGF0IG5lZWRzIHRvIGJlIGVzY2FwZWRcbiAgICB2YXIgc291cmNlID0gJyg/OicgKyBfLmtleXMobWFwKS5qb2luKCd8JykgKyAnKSc7XG4gICAgdmFyIHRlc3RSZWdleHAgPSBSZWdFeHAoc291cmNlKTtcbiAgICB2YXIgcmVwbGFjZVJlZ2V4cCA9IFJlZ0V4cChzb3VyY2UsICdnJyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgc3RyaW5nID0gc3RyaW5nID09IG51bGwgPyAnJyA6ICcnICsgc3RyaW5nO1xuICAgICAgcmV0dXJuIHRlc3RSZWdleHAudGVzdChzdHJpbmcpID8gc3RyaW5nLnJlcGxhY2UocmVwbGFjZVJlZ2V4cCwgZXNjYXBlcikgOiBzdHJpbmc7XG4gICAgfTtcbiAgfTtcbiAgXy5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKGVzY2FwZU1hcCk7XG4gIF8udW5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKHVuZXNjYXBlTWFwKTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyBvYmplY3RbcHJvcGVydHldKCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIHZhciBlc2NhcGVDaGFyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07XG4gIH07XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgLy8gTkI6IGBvbGRTZXR0aW5nc2Agb25seSBleGlzdHMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgc2V0dGluZ3MsIG9sZFNldHRpbmdzKSB7XG4gICAgaWYgKCFzZXR0aW5ncyAmJiBvbGRTZXR0aW5ncykgc2V0dGluZ3MgPSBvbGRTZXR0aW5ncztcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UoZXNjYXBlciwgZXNjYXBlQ2hhcik7XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cblxuICAgICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgJ3JldHVybiBfX3A7XFxuJztcblxuICAgIHRyeSB7XG4gICAgICB2YXIgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbi4gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGluc3RhbmNlID0gXyhvYmopO1xuICAgIGluc3RhbmNlLl9jaGFpbiA9IHRydWU7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBfLmVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgXy5lYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09PSAnc2hpZnQnIHx8IG5hbWUgPT09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIF8uZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgXy5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgfTtcblxuICAvLyBBTUQgcmVnaXN0cmF0aW9uIGhhcHBlbnMgYXQgdGhlIGVuZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIEFNRCBsb2FkZXJzXG4gIC8vIHRoYXQgbWF5IG5vdCBlbmZvcmNlIG5leHQtdHVybiBzZW1hbnRpY3Mgb24gbW9kdWxlcy4gRXZlbiB0aG91Z2ggZ2VuZXJhbFxuICAvLyBwcmFjdGljZSBmb3IgQU1EIHJlZ2lzdHJhdGlvbiBpcyB0byBiZSBhbm9ueW1vdXMsIHVuZGVyc2NvcmUgcmVnaXN0ZXJzXG4gIC8vIGFzIGEgbmFtZWQgbW9kdWxlIGJlY2F1c2UsIGxpa2UgalF1ZXJ5LCBpdCBpcyBhIGJhc2UgbGlicmFyeSB0aGF0IGlzXG4gIC8vIHBvcHVsYXIgZW5vdWdoIHRvIGJlIGJ1bmRsZWQgaW4gYSB0aGlyZCBwYXJ0eSBsaWIsIGJ1dCBub3QgYmUgcGFydCBvZlxuICAvLyBhbiBBTUQgbG9hZCByZXF1ZXN0LiBUaG9zZSBjYXNlcyBjb3VsZCBnZW5lcmF0ZSBhbiBlcnJvciB3aGVuIGFuXG4gIC8vIGFub255bW91cyBkZWZpbmUoKSBpcyBjYWxsZWQgb3V0c2lkZSBvZiBhIGxvYWRlciByZXF1ZXN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCd1bmRlcnNjb3JlJywgW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIG1vZHVsZSwgYm9vdHN0cmFwcGVkKi9cclxuXHJcbi8vIGdhbWUgcmVzb3VyY2VzXHJcbi8vIGluIHRoZSBjYXNlIG9mIHRoZSBpdGVtcywgc2V0IHRoZWlyIGltYWdlIG5hbWUgZXF1YWwgdG8gdGhlaXIgdHlwZS5cclxuZnVuY3Rpb24gZ2V0U2hpcEFzc2V0cyhzaGlwVHlwZSkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdmFyIHJhY2UgPSBzaGlwVHlwZS5zcGxpdCgnXycpWzBdO1xyXG4gICAgcmV0dXJuIFt7XHJcbiAgICAgICAgbmFtZTogc2hpcFR5cGUsXHJcbiAgICAgICAgdHlwZTogJ3RteCcsXHJcbiAgICAgICAgc3JjOiAnL19jb21tb24vb3V0bGluZXMvJyArIHNoaXBUeXBlICsgJy50bXgnXHJcbiAgICB9LCB7XHJcbiAgICAgICAgbmFtZTogc2hpcFR5cGUgKyAnX2ltZycsXHJcbiAgICAgICAgdHlwZTogJ2ltYWdlJyxcclxuICAgICAgICBzcmM6ICcvX2NvbW1vbi9pbWcvcmVuZGVyL3NoaXBzLycgKyByYWNlICtcclxuICAgICAgICAgICAgJy8nICsgc2hpcFR5cGUgKyAnX2ltZy5wbmcnXHJcbiAgICB9XTtcclxufVxyXG5cclxudmFyIGFzc2V0cyA9IFt7XHJcbiAgICBuYW1lOiAnb3V0bGluZScsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9vdXRsaW5lLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ3NlbGVjdG9yJyxcclxuICAgIHR5cGU6ICdpbWFnZScsXHJcbiAgICBzcmM6ICcvX2NvbW1vbi9pbWcvcmVuZGVyL3NlbGVjdG9yLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ3BhdXNlLWljb24nLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvcGF1c2UtaWNvbi5wbmcnXHJcbn0sIHtcclxuICAgIG5hbWU6ICd3ZWFwb24nLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvd2VhcG9uXzAxLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ2VuZ2luZScsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9lbmdpbmVfMDEucG5nJ1xyXG59LCB7XHJcbiAgICBuYW1lOiAncG93ZXInLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvcG93ZXJfMDEucG5nJ1xyXG59LCB7XHJcbiAgICBuYW1lOiAnY29uc29sZScsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9jb25zb2xlXzAyLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ2NvbXBvbmVudCcsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9jb21wb25lbnRzXzAxLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ2Rvb3InLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvZG9vcl8wMS5wbmcnXHJcbn0sIHtcclxuICAgIG5hbWU6ICd3YWxsJyxcclxuICAgIHR5cGU6ICdpbWFnZScsXHJcbiAgICBzcmM6ICcvX2NvbW1vbi9pbWcvcmVuZGVyL3dhbGxfMDAxLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ3dlYWtzcG90JyxcclxuICAgIHR5cGU6ICdpbWFnZScsXHJcbiAgICBzcmM6ICcvX2NvbW1vbi9pbWcvcmVuZGVyL3dlYWtzcG90LnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ3RlbGVwb3J0ZXInLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvdGVsZXBvcnRlci5wbmcnXHJcbn0sIHtcclxuICAgIG5hbWU6ICdtZXRhdGlsZXMzMngzMicsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9tZXRhdGlsZXMzMngzMi5wbmcnXHJcbn0sIHtcclxuICAgIG5hbWU6ICdhcmVhXzAxJyxcclxuICAgIHR5cGU6ICd0bXgnLFxyXG4gICAgc3JjOiAnL19jb21tb24vb3V0bGluZXMvc21hbGwudG14J1xyXG59LCB7XHJcbiAgICBuYW1lOiAndGVzdCcsXHJcbiAgICB0eXBlOiAndG14JyxcclxuICAgIHNyYzogJy9fY29tbW9uL291dGxpbmVzL3Rlc3QudG14J1xyXG59LCB7XHJcbiAgICBuYW1lOiAnYnV0dG9uJyxcclxuICAgIHR5cGU6ICdpbWFnZScsXHJcbiAgICBzcmM6ICcvX2NvbW1vbi9pbWcvcmVuZGVyL2J1dHRvbi5wbmcnXHJcbn0sIHtcclxuICAgIG5hbWU6ICdjcmVhdHVyZXMnLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvY3JlYXR1cmVzLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ2NyZWF0dXJlc18xNngxNicsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9jcmVhdHVyZXNfMTZ4MTYucG5nJ1xyXG59LCB7XHJcbiAgICBuYW1lOiAnc3Rhcl9oaXRfd2hpdGUnLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvc3Rhcl9oaXRfd2hpdGUucG5nJ1xyXG59LCB7XHJcbiAgICBuYW1lOiAnbm90aGluZycsXHJcbiAgICB0eXBlOiAnaW1hZ2UnLFxyXG4gICAgc3JjOiAnL19jb21tb24vaW1nL3JlbmRlci9ub3RoaW5nLnBuZydcclxufSwge1xyXG4gICAgbmFtZTogJ3Byb2plY3RpbGUnLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvcHJvamVjdGlsZS5wbmcnXHJcbn0sIHtcclxuICAgIG5hbWU6ICdtYXJrZXJzJyxcclxuICAgIHR5cGU6ICdpbWFnZScsXHJcbiAgICBzcmM6ICcvX2NvbW1vbi9pbWcvcmVuZGVyL21hcmtlcnMucG5nJ1xyXG59LCB7XHJcbiAgICBuYW1lOiAnY2hhcmdpbmctd2VhcG9uLWljb24nLFxyXG4gICAgdHlwZTogJ2ltYWdlJyxcclxuICAgIHNyYzogJy9fY29tbW9uL2ltZy9yZW5kZXIvY2hhcmdpbmctd2VhcG9uLWljb24ucG5nJ1xyXG59XTtcclxuXHJcbmFzc2V0cyA9IGFzc2V0cy5jb25jYXQoZ2V0U2hpcEFzc2V0cyhib290c3RyYXBwZWQuc2hpcEpzb24udG14TmFtZSkpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGFzc2V0czsiLCIvKlxyXG4tKi0gY29kaW5nOiB1dGYtOCAtKi1cclxuKiB2aW06IHNldCB0cz00IHN3PTQgZXQgc3RzPTQgYWk6XHJcbiogQ29weXJpZ2h0IDIwMTMgTUlUSElTXHJcbiogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuKi9cclxuXHJcbi8qZ2xvYmFsIHJlcXVpcmUsIG1lLCBzaGlwVHlwZSwgaHVsbE1hcHMqL1xyXG5cclxuLy9zdWdhclxyXG52YXIganNBcHAsIGdzLCBzaCwgU2hpcEJ1aWxkaW5nLCBhc3NldHM7XHJcbmdzID0gcmVxdWlyZSgnY2xpZW50L2dhbWUtc3RhdGUnKTtcclxuc2ggPSByZXF1aXJlKCdzaGFyZWQnKTtcclxuZ3MuVElMRV9TSVpFID0gMzIgLyBzaC5HUklEX1NVQjtcclxuZ3MuSEFMRl9USUxFID0gMTYgLyBzaC5HUklEX1NVQjtcclxuU2hpcEJ1aWxkaW5nID0gcmVxdWlyZSgnLi9zaGlwLWJ1aWxkaW5nLXNjcmVlbicpO1xyXG5hc3NldHMgPSByZXF1aXJlKCcuL2Fzc2V0cycpO1xyXG5cclxucmVxdWlyZSgnY2xpZW50L21lbG9uanMtcGx1Z2lucycpO1xyXG5cclxuanNBcHAgPSB7XHJcbiAgICBsb2FkUmVhZHk6IGZhbHNlLFxyXG4gICAgLyogLS0tXHJcblxyXG4gICAgSW5pdGlhbGl6ZSB0aGUganNBcHBcclxuXHJcbiAgICAtLS0gKi9cclxuICAgIG9ubG9hZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIC8vIGluaXQgdGhlIHZpZGVvXHJcbiAgICAgICAgLy90byBnZXQgc2hpcCB3aWR0aDogaHVsbE1hcHNbc2hpcFR5cGVdLndpZHRoICogZ3MuVElMRV9TSVpFXHJcbiAgICAgICAgaWYgKCFtZS52aWRlby5pbml0KCdqc2FwcCcsIDE0NDAsIDEzNDQpKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KCdTb3JyeSBidXQgeW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgaHRtbCA1IGNhbnZhcy4nKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBcImF1ZGlvXCJcclxuICAgICAgICAvLyAgICAgICAgbWUuYXVkaW8uaW5pdChcIm1wMyxvZ2dcIik7XHJcbiAgICAgICAgLy8gc2V0IGFsbCByZXNvdXJjZXMgdG8gYmUgbG9hZGVkXHJcbiAgICAgICAgbWUubG9hZGVyLm9ubG9hZCA9IHRoaXMubG9hZGVkLmJpbmQodGhpcyk7XHJcbiAgICAgICAgLy8gc2V0IGFsbCByZXNvdXJjZXMgdG8gYmUgbG9hZGVkXHJcbiAgICAgICAgbWUubG9hZGVyLnByZWxvYWQoYXNzZXRzKTtcclxuICAgICAgICAvLyBsb2FkIGV2ZXJ5dGhpbmcgJiBkaXNwbGF5IGEgbG9hZGluZyBzY3JlZW5cclxuICAgICAgICBtZS5zdGF0ZS5jaGFuZ2UobWUuc3RhdGUuTE9BRElORyk7XHJcbiAgICB9LFxyXG4gICAgLyogLS0tXHJcbiAgICBjYWxsYmFjayB3aGVuIGV2ZXJ5dGhpbmcgaXMgbG9hZGVkXHJcbiAgICAtLS0gKi9cclxuICAgIGxvYWRlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgZ3MucGxheWVyID0gbmV3IHNoLlBsYXllcih7XHJcbiAgICAgICAgICAgIGlkOiA3NzcsXHJcbiAgICAgICAgICAgIG5hbWU6ICdoYXJkY29kZWQgbmFtZSdcclxuICAgICAgICB9KTtcclxuICAgICAgICBtZS5zdGF0ZS5zZXQoJ3NoaXAtYnVpbGRpbmcnLCBuZXcgU2hpcEJ1aWxkaW5nKCkpO1xyXG4gICAgICAgIG1lLnN0YXRlLmNoYW5nZSgnc2hpcC1idWlsZGluZycpO1xyXG4gICAgICAgIHNlbGYubG9hZFJlYWR5ID0gdHJ1ZTtcclxuICAgICAgICBzZWxmLm9uQXBwTG9hZGVkKCk7XHJcblxyXG4gICAgfSxcclxuICAgIC8qXHJcbiAgICB1c2VmdWwgZm9yIHRlc3RpbmdcclxuICAgICovXHJcbiAgICBvbkFwcExvYWRlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG59O1xyXG5cclxud2luZG93Lm9uUmVhZHkoZnVuY3Rpb24oKSB7XHJcbiAgICAndXNlIHN0cmljdCc7XHJcbiAgICBqc0FwcC5vbmxvYWQoKTtcclxufSk7IiwiLypcclxuLSotIGNvZGluZzogdXRmLTggLSotXHJcbiogdmltOiBzZXQgdHM9NCBzdz00IGV0IHN0cz00IGFpOlxyXG4qIENvcHlyaWdodCAyMDEzIE1JVEhJU1xyXG4qIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiovXHJcblxyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCAkLCBtZSwgYm9vdHN0cmFwcGVkKi9cclxudmFyIHNoID0gcmVxdWlyZSgnc2hhcmVkJyksXHJcbiAgICBTaGlwVk0gPSByZXF1aXJlKCcuL3NoaXAtdm0nKSxcclxuICAgIHV0aWxzID0gcmVxdWlyZSgnY2xpZW50L3V0aWxzJyksXHJcbiAgICBpdGVtVk1zID0gcmVxdWlyZSgnY2xpZW50L2l0ZW0tdm1zJykuaXRlbVZNcyxcclxuICAgIHVpID0gcmVxdWlyZSgnY2xpZW50L3VpJyksXHJcbiAgICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpLl87XHJcblxyXG4vKiBTY3JlZW4gd2hlcmUgb25lIGJ1aWxkcyB0aGUgc2hpcCAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IG1lLlNjcmVlbk9iamVjdC5leHRlbmQoe1xyXG4gICAgc2hpcDogbnVsbCxcclxuICAgIHByZXZNb3VzZToge30sXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQodHJ1ZSk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIGhhcyB0bXhOYW1lIG9yIGpzb25EYXRhLlxyXG4gICAgICovXHJcbiAgICBvblJlc2V0RXZlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLy8gc3R1ZmYgdG8gcmVzZXQgb24gc3RhdGUgY2hhbmdlXHJcbiAgICAgICAgdGhpcy5zaGlwID0gbmV3IHNoLlNoaXAoe2pzb246IGJvb3RzdHJhcHBlZC5zaGlwSnNvbn0pO1xyXG4gICAgICAgIHRoaXMuc2hpcFZNID0gbmV3IFNoaXBWTSh0aGlzLnNoaXApO1xyXG4gICAgICAgIHRoaXMuc2hpcFZNLnNob3dJblNjcmVlbigpO1xyXG4gICAgICAgIHRoaXMuc2hpcC5vbkJ1aWxkaW5nc0NoYW5nZWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgc2VsZi51cGRhdGVHcmVlblNwb3RzKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbWUuZ2FtZS5zb3J0KCk7XHJcblxyXG4gICAgICAgIG1lLmlucHV0LmJpbmRLZXkobWUuaW5wdXQuS0VZLkVTQywgJ2VzY2FwZScpO1xyXG4gICAgICAgIG1lLmlucHV0LnJlZ2lzdGVyTW91c2VFdmVudCgnbW91c2Vkb3duJywgbWUuZ2FtZS52aWV3cG9ydCxcclxuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgbWUuaW5wdXQucmVnaXN0ZXJNb3VzZUV2ZW50KCdtb3VzZW1vdmUnLCBtZS5nYW1lLnZpZXdwb3J0LFxyXG4gICAgICAgICAgICB0aGlzLm1vdXNlTW92ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBtZS5pbnB1dC5yZWdpc3Rlck1vdXNlRXZlbnQoJ21vdXNldXAnLCBtZS5nYW1lLnZpZXdwb3J0LFxyXG4gICAgICAgICAgICB0aGlzLm1vdXNlVXAuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgbWUuaW5wdXQucmVnaXN0ZXJNb3VzZUV2ZW50KCdkYmxjbGljaycsIG1lLmdhbWUudmlld3BvcnQsXHJcbiAgICAgICAgICAgIHRoaXMubW91c2VEYkNsaWNrLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlTG9ja2VkT24gPSBudWxsO1xyXG4gICAgICAgIHRoaXMucHJlcGFyZUdob3N0SXRlbXMoKTtcclxuICAgICAgICB0aGlzLmdyZWVuU3BvdHMgPSBzaC51dGlscy5nZXRFbXB0eU1hdHJpeCh0aGlzLnNoaXAud2lkdGgsXHJcbiAgICAgICAgICAgIHRoaXMuc2hpcC5oZWlnaHQsIDEpO1xyXG4gICAgICAgIHRoaXMub25IdG1sTG9hZGVkKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qIC0tLVxyXG4gICAgYWN0aW9uIHRvIHBlcmZvcm0gd2hlbiBnYW1lIGlzIGZpbmlzaGVkIChzdGF0ZSBjaGFuZ2UpXHJcbiAgICAtLS0gKi9cclxuICAgIG9uRGVzdHJveUV2ZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgbWUuaW5wdXQudW5iaW5kS2V5KG1lLmlucHV0LktFWS5FU0MpO1xyXG4gICAgICAgIG1lLmlucHV0LnJlbGVhc2VNb3VzZUV2ZW50KCdtb3VzZWRvd24nLCBtZS5nYW1lLnZpZXdwb3J0KTtcclxuICAgICAgICBtZS5pbnB1dC5yZWxlYXNlTW91c2VFdmVudCgnbW91c2Vtb3ZlJywgbWUuZ2FtZS52aWV3cG9ydCk7XHJcbiAgICAgICAgbWUuaW5wdXQucmVsZWFzZU1vdXNlRXZlbnQoJ21vdXNldXAnLCBtZS5nYW1lLnZpZXdwb3J0KTtcclxuICAgICAgICBtZS5pbnB1dC5yZWxlYXNlTW91c2VFdmVudCgnZGJsY2xpY2snLCBtZS5nYW1lLnZpZXdwb3J0KTtcclxuICAgIH0sXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnNoaXBWTS51cGRhdGUoKTtcclxuICAgICAgICBpZiAobWUuaW5wdXQuaXNLZXlQcmVzc2VkKCdlc2NhcGUnKSkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZUxvY2tlZE9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdXNlTG9ja2VkT24ubG9ja2VkRXNjYXBlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hvc2VuKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNob29zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF8uZWFjaCh0aGlzLmRyYXdpbmdTY3JlZW4sIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgaXRlbS51cGRhdGUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuICAgIGRyYXc6IGZ1bmN0aW9uKGN0eCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLnBhcmVudChjdHgpO1xyXG4gICAgICAgIF8uZWFjaCh0aGlzLmRyYXdpbmdTY3JlZW4sIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgaXRlbS5kcmF3KGN0eCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgb25IdG1sTG9hZGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNjcmVlbiA9IHRoaXM7XHJcbiAgICAgICAgJCgnLml0ZW0nKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdmFyIGlkSXRlbSwgaXRlbU5hbWU7XHJcbiAgICAgICAgICAgIGlmIChtZS5zdGF0ZS5pc0N1cnJlbnQobWUuc3RhdGUuTE9BRElORykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZEl0ZW0gPSAkKCdpbWcnLCB0aGlzKS5hdHRyKCdpZCcpO1xyXG4gICAgICAgICAgICBpdGVtTmFtZSA9IGlkSXRlbS5zdWJzdHJpbmcoNSwgaWRJdGVtLmxlbmd0aCk7XHJcbiAgICAgICAgICAgIG1lLnN0YXRlLmN1cnJlbnQoKS5jaG9vc2UoaXRlbU5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL1NhdmVcclxuICAgICAgICAkKCcjZmlsZV9zYXZlJykuY2xpY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGlwSnNvbiA9IHNjcmVlbi5zaGlwLnRvSnNvbigpO1xyXG4gICAgICAgICAgICAkLnBvc3QoJy9zaGlwL3NhdmUnLCB7XHJcbiAgICAgICAgICAgICAgICBodWxsSUQ6IGJvb3RzdHJhcHBlZC5odWxsSUQsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiAkKCcjc2hpcC1uYW1lJykudmFsKCksXHJcbiAgICAgICAgICAgICAgICB0aWVyOiAkKCcjc2hpcC10aWVyJykudmFsKCksXHJcbiAgICAgICAgICAgICAgICBqc29uU3RyaW5nOiBKU09OLnN0cmluZ2lmeShzaGlwSnNvbilcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhyZWYgPSAnL3NoaXAtbGlzdD9lZGl0PXRydWUnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdFcnJvcjogQ291bGQgbm90IHNhdmUgc2hpcC4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCAnanNvbicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICQoJyNqc2FwcCcpLmZpbmQoJ2NhbnZhcycpLmNzcyh7d2lkdGg6ICcnLCBoZWlnaHQ6ICcnfSk7XHJcbiAgICB9LFxyXG4gICAgbW91c2VEYkNsaWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgLy9ub3RlOiB0aGUgXCJ0aGlzXCIgY29udGV4dCBpcyBhIGNhbnZhcywgbm90IHRoZSBzY3JlZW5cclxuICAgICAgICB2YXIgbW91c2VUaWxlLCBzY3JlZW4gPSBtZS5zdGF0ZS5jdXJyZW50KCk7XHJcbiAgICAgICAgbW91c2VUaWxlID0gdXRpbHMudG9UaWxlVmVjdG9yKHV0aWxzLmdldE1vdXNlUHgoKSwgMzIpO1xyXG4gICAgICAgIG1vdXNlVGlsZSA9IHNoLnYubXVsKG1vdXNlVGlsZSwgc2guR1JJRF9TVUIpO1xyXG4gICAgICAgIGlmIChzY3JlZW4ubW91c2VMb2NrZWRPbikgeyAvL3RoZSBtb3VzZSBpcyBpbnZvbHZlZCBpbiBhIHNwZWNpZmljIG9ialxyXG4gICAgICAgICAgICAvL2RlbGVnYXRlIGhhbmRsaW5nIHRvIHRoZSBvYmplY3RcclxuICAgICAgICAgICAgc2NyZWVuLm1vdXNlTG9ja2VkT24ubG9ja2VkTW91c2VEYkNsaWNrKG1vdXNlVGlsZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lLmdhbWUuc29ydCgpO1xyXG4gICAgICAgIG1lLmdhbWUucmVwYWludCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtb3VzZURvd246IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIG1vdXNlVGlsZSwgaXRlbSwgd2hpY2g7XHJcbiAgICAgICAgd2hpY2ggPSBlLndoaWNoIC0gMTsgLy93b3JrYXJvdW5kIGZvciBtZWxvbkpTIG1pc21hdGNoXHJcbiAgICAgICAgbW91c2VUaWxlID0gdXRpbHMudG9UaWxlVmVjdG9yKHV0aWxzLmdldE1vdXNlUHgoKSwgMzIpO1xyXG4gICAgICAgIG1vdXNlVGlsZSA9IHNoLnYubXVsKG1vdXNlVGlsZSwgc2guR1JJRF9TVUIpO1xyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlTG9ja2VkT24pIHsgLy90aGUgbW91c2UgaXMgaW52b2x2ZWQgaW4gYSBzcGVjaWZpYyBvYmpcclxuICAgICAgICAgICAgLy9kZWxlZ2F0ZSBoYW5kbGluZyB0byB0aGUgb2JqZWN0XHJcbiAgICAgICAgICAgIHRoaXMubW91c2VMb2NrZWRPbi5sb2NrZWRNb3VzZURvd24obW91c2VUaWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaXRlbSA9IHRoaXMuc2hpcC5hdChtb3VzZVRpbGUueCwgbW91c2VUaWxlLnkpO1xyXG4gICAgICAgIGlmIChpdGVtICE9PSBudWxsICYmIGl0ZW0gaW5zdGFuY2VvZiBzaC5JdGVtKSB7XHJcbiAgICAgICAgICAgIGlmICh3aGljaCA9PT0gbWUuaW5wdXQubW91c2UuUklHSFQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVsZXRlSXRlbShpdGVtKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBpdGVtO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNob3Nlbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmVnaW5EcmFnKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1lLmdhbWUuc29ydCgpO1xyXG4gICAgICAgIG1lLmdhbWUucmVwYWludCgpO1xyXG4gICAgfSxcclxuICAgIG1vdXNlTW92ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBtb3VzZVRpbGUgPSB1dGlscy50b1RpbGVWZWN0b3IodXRpbHMuZ2V0TW91c2VQeCgpLCAzMik7XHJcbiAgICAgICAgaWYgKCh0aGlzLnByZXZNb3VzZS54ID09PSBtb3VzZVRpbGUueCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2TW91c2UueSA9PT0gbW91c2VUaWxlLnkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wcmV2TW91c2UueCA9IG1vdXNlVGlsZS54O1xyXG4gICAgICAgIHRoaXMucHJldk1vdXNlLnkgPSBtb3VzZVRpbGUueTtcclxuICAgICAgICBtb3VzZVRpbGUgPSBzaC52Lm11bChtb3VzZVRpbGUsIHNoLkdSSURfU1VCKTtcclxuICAgICAgICBpZiAodGhpcy5tb3VzZUxvY2tlZE9uKSB7IC8vdGhlIG1vdXNlIGlzIGludm9sdmVkIGluIGEgc3BlY2lmaWMgb2JqXHJcbiAgICAgICAgICAgIC8vZGVsZWdhdGUgaGFuZGxpbmcgdG8gdGhlIG9iamVjdFxyXG4gICAgICAgICAgICB0aGlzLm1vdXNlTG9ja2VkT24ubG9ja2VkTW91c2VNb3ZlKG1vdXNlVGlsZSk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlTG9ja2VkT24udHlwZSA9PT0gJ1dhbGwnIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZUxvY2tlZE9uLnR5cGUgPT09ICdEb29yJykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVXYWxscygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCF0aGlzLmNob3Nlbikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubW92ZUdob3N0KG1vdXNlVGlsZS54LCBtb3VzZVRpbGUueSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNob3Nlbi50eXBlID09PSAnV2FsbCcgfHxcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hvc2VuLnR5cGUgPT09ICdEb29yJykge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVdhbGxzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1lLmdhbWUuc29ydCgpO1xyXG4gICAgICAgIG1lLmdhbWUucmVwYWludCgpO1xyXG4gICAgfSxcclxuICAgIG1vdXNlVXA6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIG1vdXNlVGlsZSwgd2hpY2g7XHJcbiAgICAgICAgd2hpY2ggPSBlLndoaWNoIC0gMTsgLy93b3JrYXJvdW5kIGZvciBtZWxvbkpTIG1pc21hdGNoXHJcbiAgICAgICAgbW91c2VUaWxlID0gdXRpbHMudG9UaWxlVmVjdG9yKHV0aWxzLmdldE1vdXNlUHgoKSwgMzIpO1xyXG4gICAgICAgIG1vdXNlVGlsZSA9IHNoLnYubXVsKG1vdXNlVGlsZSwgc2guR1JJRF9TVUIpO1xyXG4gICAgICAgIGlmICh0aGlzLm1vdXNlTG9ja2VkT24pIHsgLy90aGUgbW91c2UgaXMgaW52b2x2ZWQgaW4gYSBzcGVjaWZpYyBvYmplY3RcclxuICAgICAgICAgICAgLy9kZWxlZ2F0ZSBoYW5kbGluZyB0byB0aGUgb2JqZWN0XHJcbiAgICAgICAgICAgIHRoaXMubW91c2VMb2NrZWRPbi5sb2NrZWRNb3VzZVVwKG1vdXNlVGlsZSk7XHJcbiAgICAgICAgICAgIG1lLmdhbWUuc29ydCgpO1xyXG4gICAgICAgICAgICBtZS5nYW1lLnJlcGFpbnQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2hvc2VuICYmICF0aGlzLmRyYWdnaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh3aGljaCA9PT0gbWUuaW5wdXQubW91c2UuTEVGVCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZEl0ZW0obW91c2VUaWxlLngsIG1vdXNlVGlsZS55LCB0aGlzLmNob3Nlbi50eXBlKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNob3Nlbi50eXBlID09PSAnRG9vcicgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9zZW4udHlwZSA9PT0gJ1dhbGwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVXYWxscygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRyYWdnaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5kRHJhZyhtb3VzZVRpbGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWUuZ2FtZS5zb3J0KCk7XHJcbiAgICAgICAgbWUuZ2FtZS5yZXBhaW50KCk7XHJcblxyXG4gICAgfSxcclxuICAgIHVwZGF0ZVdhbGxzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGl0ZW1zID0gXy51bmlvbihtZS5nYW1lLmdldEVudGl0eUJ5TmFtZSgnaXRlbScpLFxyXG4gICAgICAgICAgICB0aGlzLmRyYXdpbmdTY3JlZW4pO1xyXG4gICAgICAgIF8uaW52b2tlKF8ud2hlcmUoaXRlbXMsIHt0eXBlOiAnV2FsbCd9KSwgJ3VwZGF0ZUFuaW1hdGlvbicpO1xyXG4gICAgfSxcclxuICAgIGJ1aWxkSXRlbTogZnVuY3Rpb24oeCwgeSwgdHlwZSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgYnVpbHQgPSB0aGlzLnNoaXAuYnVpbGRBdCh4LCB5LCB0eXBlKTtcclxuICAgICAgICBpZiAoYnVpbHQpIHtcclxuICAgICAgICAgICAgdGhpcy5zaGlwVk0udXBkYXRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hpcFZNLmdldFZNKGJ1aWx0KS5vbkJ1aWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGRlbGV0ZUl0ZW06IGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5zaGlwLnJlbW92ZShpdGVtLCB0cnVlKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZVJlZCgpO1xyXG4gICAgfSxcclxuICAgIG1ha2VJdGVtOiBmdW5jdGlvbih0eXBlLCBzZXR0aW5ncykge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgQ29uc3RydWN0b3IsIG1vZGVsO1xyXG4gICAgICAgIG1vZGVsID0gbmV3IHNoLml0ZW1zW3R5cGVdKHNldHRpbmdzKTtcclxuICAgICAgICBDb25zdHJ1Y3RvciA9IGl0ZW1WTXNbdHlwZV07XHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcihtb2RlbCk7XHJcbiAgICB9LFxyXG4gICAgLyogVXNlciBJbnRlcmZhY2UgU3R1ZmYqL1xyXG4gICAgY2hvc2VuOiBudWxsLCAvL3RoZSBjaG9zZW4gb2JqZWN0IGZyb20gdGhlIHBhbmVsIChhbiBJdGVtKVxyXG4gICAgbW91c2VMb2NrZWRPbjogbnVsbCwgLy93aG8gdGhlIG1vdXNlIGFjdGlvbnMgcGVydGFpbiB0by5cclxuICAgIGdob3N0SXRlbXM6IHt9LCAvL0l0ZW1zIHRoYXQgZXhpc3QgZm9yIHRoZSBzb2xlIHB1cnBvc2Ugb2YuLi5cclxuICAgIHByZXBhcmVHaG9zdEl0ZW1zOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHR5cGUsIG5ld0l0ZW07XHJcbiAgICAgICAgdGhpcy5naG9zdEl0ZW1zID0ge307Ly9JdGVtcyB0byBiZSB1c2VkIHdoZW4gY2hvb3NpbmcgYnVpbGRpbmcgbG9jYXRpb25cclxuICAgICAgICBmb3IgKHR5cGUgaW4gaXRlbVZNcykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbVZNcy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSkge1xyXG4gICAgICAgICAgICAgICAgbmV3SXRlbSA9IHRoaXMubWFrZUl0ZW0odHlwZSwge3g6IDAsIHk6IDB9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2hvc3RJdGVtc1t0eXBlXSA9IG5ld0l0ZW07XHJcbiAgICAgICAgICAgICAgICBuZXdJdGVtLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIG1lLmdhbWUuYWRkKG5ld0l0ZW0sIHVpLmxheWVycy5pbmRpY2F0b3JzKTtcclxuICAgICAgICAgICAgICAgIG5ld0l0ZW0ub25TaGlwKGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLy8gLi4uc2hvd2luZyB0aGUgcG9zaXRpb24gYXQgd2hpY2ggdGhleSB3aWxsIGJlIGJ1aWx0LlxyXG4gICAgY2hvb3NlOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICh0aGlzLmNob3Nlbikge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jaG9zZW4udHlwZSA9PT0gbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2hvc2VuLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy5jbGVhclJlZCgpO1xyXG4gICAgICAgICAgICAkKCcjaXRlbV8nICsgdGhpcy5jaG9zZW4udHlwZSkucmVtb3ZlQ2xhc3MoJ2Nob3NlbicpO1xyXG5cclxuICAgICAgICAgICAgbWUuZ2FtZS5yZXBhaW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2hvc2VuID0gdGhpcy5naG9zdEl0ZW1zW25hbWVdO1xyXG4gICAgICAgIGlmICghdGhpcy5jaG9zZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5jaG9zZW4gPSBudWxsO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBtb3VzZSA9IHV0aWxzLmdldE1vdXNlKCk7XHJcbiAgICAgICAgdGhpcy5jaG9zZW5cclxuICAgICAgICAgICAgLnNldFgobW91c2UueClcclxuICAgICAgICAgICAgLnNldFkobW91c2UueSlcclxuICAgICAgICAgICAgLnNob3coKS5hbHBoYSA9IDAuODtcclxuICAgICAgICB0aGlzLnVwZGF0ZUdyZWVuU3BvdHMoKTtcclxuXHJcbiAgICAgICAgJCgnI2l0ZW1fJyArIHRoaXMuY2hvc2VuLnR5cGUpLmFkZENsYXNzKCdjaG9zZW4nKTtcclxuICAgICAgICBtZS5nYW1lLnNvcnQoKTtcclxuICAgICAgICBtZS5nYW1lLnJlcGFpbnQoKTtcclxuICAgIH0sXHJcbiAgICBtb3ZlR2hvc3Q6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5jaG9zZW4uc2V0WCh4KS5zZXRZKHkpO1xyXG4gICAgICAgIC8vUm90YXRlIGlmIGl0IGZpdHMgc29tZXdoZXJlXHJcbiAgICAgICAgaWYgKCF0aGlzLmNob3Nlbi5yb3RhdGVkKCkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hvc2VuLm0uY2FuQnVpbGRSb3RhdGVkKHgsIHksIHRoaXMuc2hpcCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jaG9zZW4ucm90YXRlZCh0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuY2hvc2VuLnJvdGF0ZWQoKSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5jaG9zZW4ubS5jYW5CdWlsZEF0KHgsIHksIHRoaXMuc2hpcCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jaG9zZW4ucm90YXRlZChmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudXBkYXRlUmVkKCk7XHJcbiAgICB9LFxyXG4gICAgLy9EcmFnZ2luZ1xyXG4gICAgZHJhZ2dpbmc6IG51bGwsXHJcbiAgICBiZWdpbkRyYWc6IGZ1bmN0aW9uKGJ1aWxkaW5nKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICh0aGlzLmNob3Nlbikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnVGhlcmUgc2hvdWxkIGJlIG5vdGhpbmcgY2hvc2VuIHdoZW4gZHJhZyBiZWdpbnMuICcgK1xyXG4gICAgICAgICAgICAgICAgJyh0aGlzLmJlZ2luRHJhZyknKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zaGlwLnJlbW92ZShidWlsZGluZywgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5jaG9vc2UoYnVpbGRpbmcudHlwZSk7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZyA9IGJ1aWxkaW5nO1xyXG4gICAgfSxcclxuICAgIGVuZERyYWc6IGZ1bmN0aW9uKG1vdXNlKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIGlmICghdGhpcy5kcmFnZ2luZykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmRyYWdnaW5nLmNhbkJ1aWxkQXQobW91c2UueCwgbW91c2UueSwgdGhpcy5zaGlwKSkge1xyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nLnggPSBtb3VzZS54O1xyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nLnkgPSBtb3VzZS55O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNoaXAuYWRkSXRlbSh0aGlzLmRyYWdnaW5nKTtcclxuICAgICAgICB0aGlzLmNob29zZSgpO1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmcgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuc2hpcFZNLnVwZGF0ZSgpO1xyXG4gICAgfSxcclxuICAgIC8vUmVkIG92ZXJsYXlcclxuICAgIHJlZFNjcmVlbjogW10sXHJcbiAgICByZWRJbmRleDogMCxcclxuICAgIHByaW50UmVkOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHRoaXMucmVkU2NyZWVuW3RoaXMucmVkSW5kZXhdID0gbmV3IHVpLlJlZENvbG9yRW50aXR5KHgsIHksIHt9KTtcclxuICAgICAgICBtZS5nYW1lLmFkZCh0aGlzLnJlZFNjcmVlblt0aGlzLnJlZEluZGV4XSwgdWkubGF5ZXJzLmNvbG9yT3ZlcmxheSk7XHJcbiAgICAgICAgdGhpcy5yZWRJbmRleCsrO1xyXG4gICAgfSxcclxuICAgIGNsZWFyUmVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIGk7XHJcbiAgICAgICAgZm9yIChpID0gdGhpcy5yZWRJbmRleDsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgICAgICBtZS5nYW1lLnJlbW92ZSh0aGlzLnJlZFNjcmVlbltpIC0gMV0pO1xyXG4gICAgICAgICAgICB0aGlzLnJlZFNjcmVlbi5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5yZWRJbmRleCA9IDA7XHJcbiAgICB9LFxyXG4gICAgdXBkYXRlUmVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdGhpcy5jbGVhclJlZCgpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBpZiAodGhpcy5jaG9zZW4pIHtcclxuICAgICAgICAgICAgdGhpcy5jaG9zZW4udGlsZXMoZnVuY3Rpb24oaVgsIGlZKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5ncmVlblNwb3RzW2lZXVtpWF0gPT09IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnByaW50UmVkKGlYLCBpWSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIHNlbGYuc2hpcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vQSBtYXRyaXggb2YgMSBhbmQgMC4gSW4gMSBzaG91bGQgYmUgcmVkIG92ZXJsYXkgd2hlbiB0cnlpbmcgdG8gYnVpbGRcclxuICAgIGdyZWVuU3BvdHM6IG51bGwsXHJcbiAgICB1cGRhdGVHcmVlblNwb3RzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAndXNlIHN0cmljdCc7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBzaGlwID0gdGhpcy5zaGlwO1xyXG4gICAgICAgIGlmICghdGhpcy5jaG9zZW4pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZWxmLmdyZWVuU3BvdHMgPSBzaC51dGlscy5nZXRFbXB0eU1hdHJpeChzaGlwLndpZHRoLCBzaGlwLmhlaWdodCwgMSk7XHJcbiAgICAgICAgc2hpcC5tYXAudGlsZXMoZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAgICAgICB2YXIgaSwgaiwgY1dpZHRoLCBjSGVpZ2h0O1xyXG4gICAgICAgICAgICBpZiAoc2VsZi5jaG9zZW4ubS5jYW5CdWlsZEF0KHgsIHksIHNoaXApKSB7XHJcbiAgICAgICAgICAgICAgICBjV2lkdGggPSBzZWxmLmNob3Nlbi5zaXplWzBdO1xyXG4gICAgICAgICAgICAgICAgY0hlaWdodCA9IHNlbGYuY2hvc2VuLnNpemVbMV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHNlbGYuY2hvc2VuLm0uY2FuQnVpbGRSb3RhdGVkKHgsIHksIHNoaXApKSB7XHJcbiAgICAgICAgICAgICAgICBjV2lkdGggPSBzZWxmLmNob3Nlbi5zaXplWzFdO1xyXG4gICAgICAgICAgICAgICAgY0hlaWdodCA9IHNlbGYuY2hvc2VuLnNpemVbMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChpID0geDsgaSA8IGNXaWR0aCArIHggJiYgaSA8IHNoaXAud2lkdGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgZm9yIChqID0geTsgaiA8IGNIZWlnaHQgKyB5ICYmIGogPCBzaGlwLmhlaWdodDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5ncmVlblNwb3RzW2pdW2ldID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIGRyYXdpbmdTY3JlZW46IFtdLFxyXG4gICAgLy9kcmF3cyBhcmJpdHJhcnkgc3R1ZmZcclxuICAgIGRyYXdJdGVtOiBmdW5jdGlvbih4LCB5LCB0eXBlKSB7XHJcbiAgICAgICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgICAgIHZhciBpdGVtID0gdGhpcy5tYWtlSXRlbSh0eXBlLCB7eDogeCwgeTogeX0pO1xyXG4gICAgICAgIGl0ZW0uYWxwaGEgPSAwLjg7XHJcbiAgICAgICAgdGhpcy5kcmF3aW5nU2NyZWVuLnB1c2goaXRlbSk7XHJcbiAgICAgICAgbWUuZ2FtZS5yZXBhaW50KCk7XHJcbiAgICB9LFxyXG4gICAgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB0aGlzLmRyYXdpbmdTY3JlZW4gPSBbXTtcclxuICAgICAgICB0aGlzLmNsZWFyUmVkKCk7XHJcbiAgICAgICAgbWUuZ2FtZS5yZXBhaW50KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vY29tYmluZXMgdGhlIHNoaXAgbWFwIHdpdGggdGhlIGRyYXdpbmcgc2NyZWVuXHJcbiAgICBhdDogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAgICd1c2Ugc3RyaWN0JztcclxuICAgICAgICB2YXIgaSwgc2hpcFRpbGU7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZHJhd2luZ1NjcmVlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5kcmF3aW5nU2NyZWVuW2ldLm9jY3VwaWVzKHt4OiB4LCB5OiB5fSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRyYXdpbmdTY3JlZW5baV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgc2hpcFRpbGUgPSB0aGlzLnNoaXAubWFwLmF0KHgsIHkpO1xyXG4gICAgICAgIGlmIChzaGlwVGlsZSA9PT0gc2gudGlsZXMuY2xlYXIgJiYgdGhpcy5jaG9zZW4gJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hvc2VuLm9jY3VwaWVzKHt4OiB4LCB5OiB5fSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2hvc2VuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2hpcFRpbGU7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbiIsIi8qXHJcbi0qLSBjb2Rpbmc6IHV0Zi04IC0qLVxyXG4qIHZpbTogc2V0IHRzPTQgc3c9NCBldCBzdHM9NCBhaTpcclxuKiBDb3B5cmlnaHQgMjAxMyBNSVRISVNcclxuKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxyXG4qL1xyXG5cclxuLypnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBtZSwgXywga28qL1xyXG5cclxudmFyIHV0aWxzID0gcmVxdWlyZSgnY2xpZW50L3V0aWxzJyksXHJcbiAgICBJdGVtVk0gPSByZXF1aXJlKCdjbGllbnQvaXRlbS12bXMnKS5JdGVtVk0sXHJcbiAgICBpdGVtVk1zID0gcmVxdWlyZSgnY2xpZW50L2l0ZW0tdm1zJykuaXRlbVZNcyxcclxuICAgIHVpID0gcmVxdWlyZSgnY2xpZW50L3VpJyk7XHJcblxyXG4vKipcclxuICogQW4gb2JqZWN0IGluIGNoYXJnZSBvZiByZXByZXNlbnRpbmcgYSBzaC5TaGlwIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEBwYXJhbSB7c2guU2hpcH0gc2hpcE1vZGVsIHRoZSBzaGlwIG1vZGVsLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBTaGlwVk0gPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNoaXBNb2RlbCkge1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG4gICAgdGhpcy5pdGVtVk1zID0gW107XHJcblxyXG4gICAgdGhpcy5tID0gc2hpcE1vZGVsO1xyXG4gICAgdGhpcy5zaG93SW5TY3JlZW4gPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBtZS5sZXZlbERpcmVjdG9yLmxvYWRMZXZlbCh0aGlzLm0udG14TmFtZSk7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGVzIG1lbG9uSlMgb2JqZWN0cyBmb3IgaXRlbXMgdG8gYmUgZHJhd24gb24gdGhlIHNjcmVlblxyXG4gICAgICogYWNjb3JkaW5nIHRvIHRoZSBzaGlwIG1vZGVsLlxyXG4gICAgICogQHJldHVybiB7Ym9vbH1cclxuICAgICAqIEB0aGlzIHtTaGlwVk19XHJcbiAgICAgKi9cclxuICAgIHRoaXMudXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHNvbWV0aGluZ0NoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgICBpZiAodGhpcy51cGRhdGVJdGVtcygpKSB7XHJcbiAgICAgICAgICAgIHNvbWV0aGluZ0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc29tZXRoaW5nQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICBtZS5nYW1lLnNvcnQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHNvbWV0aGluZ0NoYW5nZWQ7XHJcbiAgICB9O1xyXG4gICAgdGhpcy51cGRhdGVJdGVtcyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB1dGlscy51cGRhdGVWTXMoe1xyXG4gICAgICAgICAgICBtb2RlbHM6IHRoaXMubS5idWlsdCxcclxuICAgICAgICAgICAgdm1zOiB0aGlzLml0ZW1WTXMsXHJcbiAgICAgICAgICAgIHpJbmRleDogdWkubGF5ZXJzLml0ZW1zLFxyXG4gICAgICAgICAgICBEZWZhdWx0Q29uc3RydWN0b3I6IEl0ZW1WTSxcclxuICAgICAgICAgICAgdm1Db25zdHJ1Y3RvcnM6IGl0ZW1WTXNcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICB0aGlzLmRyYXcgPSBmdW5jdGlvbihjdHgpIHtcclxuICAgICAgICByZXR1cm4gY3R4O1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFZNID0gZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgIHJldHVybiB1dGlscy5nZXRWTShpdGVtLCB0aGlzLm0uYnVpbHQsIHRoaXMuaXRlbVZNcyk7XHJcbiAgICB9O1xyXG59O1xyXG4iXX0=

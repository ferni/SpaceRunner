/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, pr, ItemVM, PF, hullMap, utils, width, height,
TileEntityVM, sh*/

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
    },
    whenOffShip: function() {
        'use strict';
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
itemVMs.WeaponVM = ItemVM.extend({
    // init function
    init: function(weaponModel) {
        'use strict';
        this.type = 'Weapon';
        this.size = weaponModel.size;
        this.totalSize = [3 * sh.GRID_SUB, 2 * sh.GRID_SUB];
        this.m = weaponModel;
        this.parent(weaponModel.x, weaponModel.y, {});
        this.onShip(weaponModel.onShip());
    }
});

/**
 * Engine view model.
 * @type {void|*|Class|extend|extend|extend}
 */
itemVMs.EngineVM = ItemVM.extend({
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
itemVMs.PowerVM = ItemVM.extend({
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
itemVMs.ConsoleVM = ItemVM.extend({
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
itemVMs.ComponentVM = ItemVM.extend({
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
itemVMs.DoorVM = ItemVM.extend({
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
itemVMs.WallVM = ItemVM.extend({
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
    updateAnimation: function() {
        'use strict';
        var wallsAround = [], animationName;
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
    update: function() {
        'use strict';
        //TODO: update only when necessary, right now it's running all the time
        var screen = me.state.current(),
            top = screen.at(this.x, this.y - 1),
            left = screen.at(this.x - 1, this.y),
            bot = screen.at(this.x, this.y + 1),
            right = screen.at(this.x + 1, this.y);
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
        pfMatrix = ui.greenSpots;
        //self tile will be walkable for pathfinding purposes
        pfMatrix[this.y][this.x] = 0;
        this.alpha = 0.8;
        if (ui.chosen) {
            ui.chosen.hide();
        }
        t = this.temp;
        t.grid = new PF.Grid(this.m.ship.width, this.m.ship.height, pfMatrix);
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
        cloneGrid = t.grid.clone();
        t.path = t.finder.findPath(t.pivotX, t.pivotY,
            mouseTile.x, mouseTile.y, cloneGrid);
        _.each(t.path, function(p, index) {
            if (index > 0) {
                ui.drawItem(p[0], p[1], 'Wall');
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
itemVMs.WeakSpotVM = ItemVM.extend({
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

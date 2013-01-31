/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, pr, ItemObject, PF, ui, charMap, ship, utils, WIDTH, HEIGHT*/

/*
    In each item, set size and type before calling parent()
*/
// weapon object
var iWeaponObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'weapon';
        this.size = [2, 2];
        this.totalSize = [3, 2];
        this.parent(x, y, settings, true);
    },
    buildPlacementRules: function() {
        'use strict';
        this.parent();
        this.placementRules.push(new pr.PlacementRule({
            tile: charMap.codes._front,
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
var iEngineObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'engine';
        this.size = [2, 2];
        this.totalSize = [3, 2];
        this.cannonTile = [1, 0];
        this.parent(x, y, settings);
    },
    buildPlacementRules: function() {
        'use strict';
        this.parent();
        this.placementRules.push(new pr.PlacementRule({
            tile: charMap.codes._back,
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
var iPowerObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'power';
        this.size = [2, 2];
        this.parent(x, y, settings);
    }
});

// console object class
var iConsoleObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'console';
        this.size = [1, 1];
        this.parent(x, y, settings);
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
var iComponentObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'component';
        this.size = [2, 2];
        this.parent(x, y, settings, this.mResource);
        // add animation
        this.addAnimation('idle', [3]);
        this.addAnimation('charge', [0, 1, 2, 3, 4, 5, 5]);
        // set animation
        this.offShipAnimations = ['idle'];
        this.onShipAnimations = ['charge'];
        this.animationspeed = 15;
    }
});

// door object class
var iDoorObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'door';
        this.size = [2, 1];
        this.parent(x, y, settings);

        // add animation
        this.addAnimation('idle', [2]);
        this.addAnimation('h_open_close',
            [0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 2, 0]);
        this.addAnimation('v_open_close',
            [1, 3, 5, 7, 9, 11, 11, 9, 7, 5, 3, 1]);
        this.anchorPoint.x = 0.25;
        this.anchorPoint.y = 0.5;
        // set animation
        this.offShipAnimations = ['idle'];
        this.onShipAnimations = ['h_open_close', 'v_open_close'];
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
    canBuildRotated: function(x, y) {
        'use strict';
        return _.every(this.rotatedPlacementRules, function(r) {
            return r.compliesAt(x, y, ship.map());
        });
    }

});
// wall object class
var iWallObject = ItemObject.extend({
    // init function
    init: function(x, y, settings) {
        'use strict';
        this.type = 'wall';
        this.size = [1, 1];
        this.parent(x, y, settings);
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
        var wallsAround, x, y, top, left, bot, right, animationName;
        if (window.ship === undefined) {
            return;
        }
        wallsAround = [];
        x = this._x;
        y = this._y;
        top = ui.mapAt(x, y - 1);
        left = ui.mapAt(x - 1, y);
        bot = ui.mapAt(x, y + 1);
        right = ui.mapAt(x + 1, y);
        if (top !== null && (top.type === 'wall' ||
            (top.type === 'door' && top.rotated() && top.y() === y - 2))) {
            wallsAround.push('t');
        }
        if (left !== null && (left.type === 'wall' ||
            (left.type === 'door' && !left.rotated() && left.x() === x - 2))) {
            wallsAround.push('l');
        }
        if (bot !== null && (bot.type === 'wall' ||
            (bot.type === 'door' && bot.rotated() && bot.y() === y + 1))) {
            wallsAround.push('b');
        }
        if (right !== null && (right.type === 'wall' ||
            (right.type === 'door' && !right.rotated() &&
            right.x() === x + 1))) {
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
        var pfMatrix, t;
        this.parent();
        if (ui.mouseLockedOn === this) {
            return;
        }
        pfMatrix = utils.getEmptyMatrix(WIDTH, HEIGHT, 1);
        utils.levelTiles(function(x, y) {
            if (ship.map()[y][x] === charMap.codes._cleared) {
                pfMatrix[y][x] = 0; //cleared tiles are walkable
            }
        });
        //self tile will be walkable for pathfinding purposes
        pfMatrix[this.y()][this.x()] = 0;

        t = this.temp;
        t.grid = new PF.Grid(WIDTH, HEIGHT, pfMatrix);
        t.preMouseX = this.x();
        t.preMouseY = this.y();
        t.pivotX = this.x();
        t.pivotY = this.y();
        t.paths = [];
        t.lastPathIndex = 0;
        ui.mouseLockedOn = this;
    },
    lockedMouseMove: function(mouseTile) {
        'use strict';
        var t, finder, cloneGrid, path, i, f;
        this.parent();
        t = this.temp;

        if ((mouseTile.x === t.pivotX && mouseTile.y === t.pivotY) ||
            (mouseTile.x === t.preMouseX && mouseTile.y === t.preMouseY)) {
            return;
        }
        t.preMouseX = mouseTile.x;
        t.preMouseY = mouseTile.y;
        ui.clear();
        finder = new PF.BestFirstFinder();
        cloneGrid = t.grid.clone();
        path = finder.findPath(t.pivotX, t.pivotY,
            mouseTile.x, mouseTile.y, cloneGrid);

        t.paths[t.lastPathIndex] = path; //replace last path
        for (i = t.paths.length - 1; i >= 0; i--) {
            for (f = 1; f < t.paths[i].length; f++) {
                ui.draw(t.paths[i][f][0], t.paths[i][f][1], 'wall');
            }
        }
    },
    lockedMouseUp: function(mouseTile) {
        'use strict';
        var t, lastPath, i;
        this.parent();
        if (!this.canBuildAt(mouseTile.x, mouseTile.y)) {
            return;
        }
        t = this.temp;
        lastPath = t.paths[t.lastPathIndex];
        if (lastPath) {
            for (i = 0; i < lastPath.length; i++) {
                t.grid.setWalkableAt(lastPath[i][0], lastPath[i][1], false);
            }
        }
        t.pivotX = mouseTile.x;
        t.pivotY = mouseTile.y;
        t.lastPathIndex++;

    },
    lockedMouseDbClick: function(mouseTile) {
        'use strict';
        this.parent();
        _.each(ui.drawingScreen, function(wall) {
            ship.buildAt(wall.x(), wall.y(), 'wall');
        });
        ui.clear();

        ui.mouseLockedOn = null;
    },
    lockedEscape: function() {
        'use strict';
        ui.clear();

        ui.mouseLockedOn = null;
        ship.remove(this);
    }
});


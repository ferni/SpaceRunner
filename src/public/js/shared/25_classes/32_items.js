/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('../25_classes/30_tile-entity'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * Represents a component from the ship (Engine, Weapon, etc).
 * @type {*}
 */
sh.Item = sh.TileEntity.extendShared({
    size: [1, 1],
    walkable: false,
    init: function(json) {
        'use strict';
        this.parent(json);
        this.set('Item', [], json);
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
    canBuildRotated: function(x, y, ship) {
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
        this.placementRule = sh.pr.make.spaceRule(sh.tiles.clear,
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
        this.set('Weapon', [], json);
        this.setSize(2 * sh.GRID_SUB, 2 * sh.GRID_SUB);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return sh.pr.weapon.compliesAt(x, y, ship.map);
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
        this.set('Engine', [], json);
        this.setSize(2 * sh.GRID_SUB, 2 * sh.GRID_SUB);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return sh.pr.Engine.compliesAt(x, y, ship.map);
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
        this.set('Power', [], json);
        this.setSize(2 * sh.GRID_SUB, 2 * sh.GRID_SUB);
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
        this.set('Console', [], json);
        this.setSize(sh.GRID_SUB, sh.GRID_SUB);
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return sh.pr.console.compliesAt(x, y, ship.map);
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
        for (y = this.y + sh.GRID_SUB; y >= this.y - sh.GRID_SUB;
                y -= sh.GRID_SUB) {
            for (x = this.x - sh.GRID_SUB; x <= this.x + sh.GRID_SUB;
                    x += sh.GRID_SUB) {
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
        this.set('Component', [], json);
        this.setSize(2 * sh.GRID_SUB, 2 * sh.GRID_SUB);
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
        this.set('Door', [], json);
        this.setSize(2 * sh.GRID_SUB, sh.GRID_SUB);
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return sh.pr.door.compliesAt(x, y, ship.map);
    },
    canBuildRotated: function(x, y, ship) {
        'use strict';
        return sh.pr.doorRotated.compliesAt(x, y, ship.map);
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
        this.set('Wall', [], json);
        this.setSize(sh.GRID_SUB, sh.GRID_SUB);
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

        var top = this.ship.at(this.x, this.y - sh.GRID_SUB),
            left = this.ship.at(this.x - sh.GRID_SUB, this.y),
            bot = this.ship.at(this.x, this.y + sh.GRID_SUB),
            right = this.ship.at(this.x + sh.GRID_SUB, this.y);
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
                top.y === y - 2 * sh.GRID_SUB) {
            this.connected.top = true;
        }
        if (left instanceof it.Wall) {
            left.connected.right = true;
            this.connected.left = true;
        } else if (left instanceof it.Door && !left.rotated() &&
                left.x === x - 2 * sh.GRID_SUB) {
            this.connected.left = true;
        }
        if (bot instanceof it.Wall) {
            bot.connected.top = true;
            this.connected.bottom = true;
        } else if (bot instanceof it.Door && bot.rotated() &&
                bot.y === y + sh.GRID_SUB) {
            this.connected.bottom = true;
        }
        if (right instanceof it.Wall) {
            right.connected.left = true;
            this.connected.right = true;
        } else if (right instanceof it.Door && !right.rotated() &&
                right.x === x + sh.GRID_SUB) {
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
        this.set('WeakSpot', [], json);
        this.setSize(2 * sh.GRID_SUB, 2 * sh.GRID_SUB);
        this.walkable = true;
    }
});

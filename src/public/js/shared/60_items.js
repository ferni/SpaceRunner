/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('./55_tile-entity'), _ = sh._;
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
        this.set('Item', ['ship'], json);
        this.rotated(json.r);
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        //default placement rule
        return sh.pr.space(this.size[0], this.size[1])
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
    init: function(json) {
        'use strict';
        this.parent(json);
        this.set('Weapon', [], json);
        this.size = [2, 2];
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
        this.size = [2, 2];
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
        this.size = [2, 2];
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
        this.size = [1, 1];
        this.walkable = true;
    },
    canBuildAt: function(x, y, ship) {
        'use strict';
        return sh.pr.console.compliesAt(x, y, ship.map);
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
        this.size = [2, 2];
    }
});

/**
 * Door. Can be placed on top of a wall or between two walls.
 * @type {*}
 */
sh.items.Door = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.set('Door', [], json);
        this.size = [2, 1];
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
 * An individual wall tile.
 * @type {*}
 */
sh.items.Wall = sh.Item.extendShared({
    init: function(json) {
        'use strict';
        this.parent(json);
        this.set('Wall', [], json);
        this.size = [1, 1];
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

        var top = this.ship.at(this.x, this.y - 1),
            left = this.ship.at(this.x - 1, this.y),
            bot = this.ship.at(this.x, this.y + 1),
            right = this.ship.at(this.x + 1, this.y);
        this.updateConnections(top, left, bot, right);
    },
    updateConnections: function(top, left, bot, right) {
        'use strict';
        //modify self and surrounding walls' connections
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
                top.y === y - 2) {
            this.connected.top = true;
        }
        if (left instanceof it.Wall) {
            left.connected.right = true;
            this.connected.left = true;
        } else if (left instanceof it.Door && !left.rotated() &&
                left.x === x - 2) {
            this.connected.left = true;
        }
        if (bot instanceof it.Wall) {
            bot.connected.top = true;
            this.connected.bottom = true;
        } else if (bot instanceof it.Door && bot.rotated() &&
                bot.y === y + 1) {
            this.connected.bottom = true;
        }
        if (right instanceof it.Wall) {
            right.connected.left = true;
            this.connected.right = true;
        } else if (right instanceof it.Door && !right.rotated() &&
                right.x === x + 1) {
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
        this.size = [2, 2];
        this.walkable = true;
    }
});

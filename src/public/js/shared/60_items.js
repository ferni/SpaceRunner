/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('./55_tile-entity'), _ = sh._;
if (exports !== undefined) {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

/* individual object class */
sh.Item = sh.TileEntity.extendShared({
    size: [1, 1],
    init: function(ship, x, y) {
        'use strict';
        this.parent(x, y);
        this.ship = ship;
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
    rotated: function(rotated){
        if(rotated === undefined) {
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
    onShip: function(ship){
        if(ship === undefined) {
            return this.ship;
        }
        this.ship = ship;
        return this;
    },
    toJson: function(){
        var self = this;
        return {
            type: self.type,
            x: self.x,
            y: self.y,
            r: self.rotated()
        }
    }
});

sh.items = {};

/*
 In each item, set size and type before calling parent()
 */
// weapon object
sh.items.Weapon = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'weapon';
        this.size = [2, 2];
        this.parent(ship, x, y);
    },
    canBuildAt: function(x, y, ship) {
        return sh.pr.weapon.compliesAt(x, y, ship.map);
    }
});

// engine object
sh.items.Engine = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'engine';
        this.size = [2, 2];
        this.parent(ship, x, y);
    },
    canBuildAt: function(x, y, ship) {
        return sh.pr.engine.compliesAt(x, y, ship.map);
    }
});

sh.items.Power = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'power';
        this.size = [2, 2];
        this.parent(ship, x, y);
    }
});

sh.items.Console = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'console';
        this.size = [1, 1];
        this.parent(ship, x, y)
    },
    canBuildAt: function(x, y, ship) {
        return sh.pr.console.compliesAt(x, y, ship.map);
    }
});

// component object class
sh.items.Component = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'component';
        this.size = [2, 2];
        this.parent(ship, x, y);
    }
});

// door object class
sh.items.Door = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'door';
        this.size = [2, 1];
        this.parent(ship, x, y);
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

// wall object class
sh.items.Wall = sh.Item.extendShared({
    // init function
    init: function(ship, x, y) {
        'use strict';
        this.type = 'wall';
        this.size = [1, 1];
        this.parent(ship, x, y);
        this.connected = {
            top: false,
            left: true,
            bottom: false,
            right: true
        };

    },
    canBuildAt: function(x, y, ship) {
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
    updateConnections: function(top, left, bot, right){
        'use strict';
        //modify self and surrounding walls' connections
        var it = sh.items,
            x = this.x, y = this.y;
        //reset
        this.connected.top = false;
        this.connected.left = false;
        this.connected.bottom = false;
        this.connected.right = false;

        if (top instanceof it.Wall) {
            top.connected.bottom = true;
            this.connected.top = true;
        } else if(top instanceof it.Door && top.rotated() &&
            top.y === y - 2) {
            this.connected.top = true;
        }
        if (left instanceof it.Wall) {
            left.connected.right = true;
            this.connected.left = true;
        }else if(left instanceof it.Door && !left.rotated() &&
            left.x === x - 2) {
            this.connected.left = true;
        }
        if (bot instanceof it.Wall) {
            bot.connected.top = true;
            this.connected.bottom = true;
        }else if(bot instanceof it.Door && bot.rotated() &&
            bot.y === y + 1) {
            this.connected.bottom = true;
        }
        if (right instanceof it.Wall) {
            right.connected.left = true;
            this.connected.right = true;
        }else if(right instanceof it.Door && !right.rotated() &&
            right.x === x + 1) {
            this.connected.right = true;
        }
    },
    isHorizontal: function(){
        return !this.connected.top && !this.connected.bottom;
        //(because it's the default state)
    },
    isVertical: function(){
        return !this.connected.left && !this.connected.right &&
            (this.connected.top || this.connected.bottom);
    }
});

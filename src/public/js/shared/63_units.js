/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('./60_items'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * A crew member.
 * @type {*}
 */
sh.Unit = sh.TileEntity.extendShared({
    id: null, //the ship is in charge of setting the id
    type: 0,
    speed: 1, //tiles per second
    maxHP: 100,
    meleeDamage: 20,
    attackCooldown: 500,//time (ms) between each attack
    lastAttack: null,  //when was the last time the unit attacked
                    // (relative to turn's start)
    imageFacesRight: true,
    orders: [],
    orderState: 'pending',
    init: function(x, y, settings) {
        'use strict';
        this.size = [1, 1];
        if (settings.type) {
            this.type = settings.type;
        }
        if (settings.speed) {
            this.speed = settings.speed;
        }
        if (settings.maxHP) {
            this.maxHP = settings.maxHP;
        }
        if (settings.meleeDamage) {
            this.meleeDamage = settings.meleeDamage;
        }
        if (settings.attackCooldown) {
            this.attackCooldown = settings.attackCooldown;
        }
        if (settings.imageFacesRight) {
            this.imageFacesRight = settings.imageFacesRight;
        }
        this.hp = this.maxHP;
        this.ownerID = settings.ownerID;
        this.parent(x, y);
    },
    toJson: function() {
        'use strict';
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            settings: {
                type: this.type,
                speed: this.speed,
                maxHP: this.maxHP,
                meleeDamage: this.meleeDamage,
                attackCooldown: this.attackCooldown,
                imageFacesRight: this.imageFacesRight,
                ownerID: this.ownerID
            }

        };
    },
    getTimeForOneTile: function() {
        'use strict';
        return 1000 / this.speed;
    },
    getTimeForMoving: function(from, to) {
        'use strict';
        var oneTileTime = this.getTimeForOneTile(),
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
        return time;
    },
    getAttackActions: function(turnTime, ship) {
        'use strict';
        var actions = [],
            self = this,
            enemies;
        if (!this.onCooldown) {//attack ready
            enemies = _.filter(ship.unitsMap.at(this.x, this.y),
                function(u) {
                    return u.ownerID !== self.ownerID;
                });
            if (enemies.length > 0) {
                actions.push(new sh.actions.Attack({
                    time: turnTime,
                    attackerID: self.id,
                    receiverID: enemies[0].id,
                    damage: self.meleeDamage,
                    duration: self.attackCooldown
                }));
            }
        }
        return actions;
    },
    getOrdersActions: function(turnTime) {
        'use strict';
        var action;
        if (this.orderState === 'pending' && this.orders.length > 0) {
            action = this.orders[0].execute(turnTime);
            if (action) {
                this.orders.shift();
                return [action];
            }
        }
        return [];
    },
    /**
     * This method will be called by the script creator every time something
     * changed.
     * @param {int} turnTime The current time.
     * @param {sh.Ship} ship The ship, representing the entire model (should be
     * Battle in the future.
     * @return {Array}
     */
    getActions: function(turnTime, ship) {
        'use strict';
        var actions = [];
        actions = actions.concat(this.getAttackActions(turnTime, ship));
        actions = actions.concat(this.getOrdersActions(turnTime, ship));
        return actions;
    }

});

/**
 * All the different types of units.
 */
sh.units = (function() {
    'use strict';
    var u = {};
    u.Zealot = sh.Unit.extendShared({
        init: function(x, y, settings) {
            this.type = 0;
            this.speed = 2;
            this.maxHP = 100;
            this.attackCooldown = 800;
            this.meleeDamage = 30;
            this.parent(x, y, settings);
        }
    });
    u.Critter = sh.Unit.extendShared({
        init: function(x, y, settings) {
            this.type = 5;
            this.speed = 1;
            this.maxHP = 50;
            this.attackCooldown = 420;
            this.meleeDamage = 8;
            this.imageFacesRight = false;
            this.parent(x, y, settings);
        }
    });
    u.MetalSpider = sh.Unit.extendShared({
        init: function(x, y, settings) {
            this.type = 28;
            this.speed = 3;
            this.maxHP = 200;
            this.attackCooldown = 1500;
            this.meleeDamage = 15;
            this.imageFacesRight = false;
            this.parent(x, y, settings);
        }
    });
    return u;
}());

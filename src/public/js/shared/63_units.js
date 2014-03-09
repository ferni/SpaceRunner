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
        this.set('Unit', ['id', 'imgIndex', 'speed', 'maxHP', 'meleeDamage',
            'attackCooldown', 'attackRange', 'imageFacesRight', 'ownerID'],
            json);
        this.hp = this.maxHP;
        this.inCombat = false;
        this.orders = [];
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
    getAttackActions: function(turnTime, ship) {
        'use strict';
        var actions = [],
            self = this,
            enemyInRange;
        if (!this.onCooldown && !this.moving && !this.dizzy) {//attack ready
            enemyInRange = _.find(ship.units,
                function(u) {
                    return u.isAlive() &&
                        self.isEnemy(u) &&
                        self.isInRange(u);
                });
            if (enemyInRange) {
                actions.push(new sh.actions.Attack({
                    time: turnTime,
                    attackerID: self.id,
                    receiverID: enemyInRange.id,
                    damage: self.meleeDamage,
                    duration: self.attackCooldown
                }));
            }
        }
        return actions;
    },
    getOrdersActions: function(turnTime, ship) {
        'use strict';
        var actions;
        if (this.orders.length > 0) {
            if (this.orders[0].finished) {
                return [];
            }
            actions = this.orders[0].getActions(turnTime, ship);
            if (this.orders[0].finished) {
                actions.push(new sh.actions.FinishOrder({
                    time: turnTime,
                    unitID: this.id
                }));
            }
            return actions;
        }
        return [];
    },
    getCombatActions: function(turnTime, ship) {
        'use strict';
        var self = this,
            unitsInTile,
            enemiesNotInCombat,
            enemy;
        if (!this.inCombat && !this.moving && !this.dizzy) {
            unitsInTile = ship.at(this.x, this.y);
            if (unitsInTile) {
                enemiesNotInCombat = _.filter(unitsInTile, function(u) {
                    return self.isEnemy(u) &&
                        !u.moving &&
                        !u.dizzy &&
                        !u.inCombat &&
                        u.isAlive();
                });
                if (enemiesNotInCombat.length > 0) {
                    //engage with one enemy
                    return [new sh.actions.LockInCombat({
                        time: turnTime,
                        unit1ID: this.id,
                        unit2ID: enemiesNotInCombat[0].id,
                        tile: {
                            x: this.x,
                            y: this.y
                        }
                    })];
                }
            }
        } else if (this.inCombat) {
            enemy = ship.getUnitByID(this.inCombat.enemyID);
            if (!enemy.isAlive() || !sh.v.equal(this, enemy)) {
                //enemy died or left, end combat
                return [new sh.actions.EndCombat({
                    time: turnTime,
                    tile: {x: this.x, y: this.y}
                })];
            }
        }
        return [];
    },
    getDamageShipActions: function(turnTime, ship) {
        'use strict';
        if (this.ownerID === -1 && //AI unit (in the future, use ship ownership)
                !this.moving &&
                !this.onCooldown && //attack ready
                !this.dizzy &&
                !this.inCombat &&
                ship.itemsMap.at(this.x, this.y) instanceof
                    sh.items.WeakSpot) {
            return [new sh.actions.DamageShip({
                time: turnTime,
                unitID: this.id,
                tile: {x: this.x, y: this.y},
                damage: this.meleeDamage,
                cooldown: this.attackCooldown
            })];
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
        if (!this.isAlive()) {
            return [];
        }
        //turn start reset
        if (turnTime === 0 && !this.moving) {
            this.blocking = true;
        }
        actions = actions.concat(this.getAttackActions(turnTime, ship));
        if (actions.length === 0) {//damage ship only if it didn't attack
            actions = actions.concat(this.getDamageShipActions(turnTime, ship));
        }
        actions = actions.concat(this.getOrdersActions(turnTime, ship));
        actions = actions.concat(this.getCombatActions(turnTime, ship));

        return actions;
    },
    isEnemy: function(unit) {
        'use strict';
        return unit.ownerID !== this.ownerID;
    },
    isInRange: function(unit) {
        'use strict';
        return sh.v.distance(unit, this) <= this.attackRange;
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
            this.meleeDamage = 30;
            this.attackRange = 3;
            this.parent(json);
            this.set('Zealot', [], json);
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
            this.set('Critter', [], json);
        }
    });
    u.MetalSpider = sh.Unit.extendShared({
        init: function(json) {
            this.imgIndex = 28;
            this.speed = 3;
            this.maxHP = 200;
            this.attackCooldown = 1500;
            this.meleeDamage = 15;
            this.imageFacesRight = false;
            this.parent(json);
            this.set('MetalSpider', [], json);
        }
    });
    return u;
}());

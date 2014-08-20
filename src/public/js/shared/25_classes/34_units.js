/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('../25_classes/32_items'), _ = sh._;
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
                'chargingShipWeapon'],
            json: json
        });
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
            enemiesInRange,
            enemyToAttack;
        if (!this.onCooldown && !this.moving && !this.dizzy) {//attack ready
            enemiesInRange = _.filter(ship.units,
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
                actions.push(new sh.actions.Attack({
                    time: turnTime,
                    attackerID: self.id,
                    receiverID: enemyToAttack.id,
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
            actions = this.orders[0].getActions(turnTime, ship);
            //if it's not gonna make it,
            //force arrival to the tile at end of turn
            if (turnTime < 4000) {
                _.chain(actions)
                    .where({type: 'Move'})
                    .each(function(a) {
                        if (a.duration + turnTime > 4000) {
                            a.duration = 4000 - turnTime;
                            a.updateModelChanges();
                        }
                    });
            }
            return actions;
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
     * If it's in a console controlling some ship structure.
     * @param {int} turnTime
     * @param {int} ship
     */
    getShipControlActions: function(turnTime, ship) {
        'use strict';
        if (this.ownerID === -1) {
            //AI units don't control consoles
            //(to be handled by ship ownership in the future)
            return [];
        }
        var standingOn = ship.itemsMap.at(this.x, this.y),
            controlled;
        if (standingOn instanceof sh.items.Console) {
            controlled = standingOn.getControlled();
        }
        if (controlled instanceof sh.items.Weapon && !controlled.chargedBy) {
            return [new sh.actions.BeginShipWeaponCharge({
                time: turnTime,
                unitID: this.id,
                weaponID: controlled.id,
                chargeTime: controlled.chargeTime
            })];
        }
        return [];
    },
    /**
     * This method will be called by the script creator every time something
     * changed. The unit's properties should not be changed in this method.
     * @param {int} turnTime The current time.
     * @param {sh.Ship} ship The ship, representing the entire model (should be
     * Battle in the future.
     * @return {Array}
     */
    getActions: function(turnTime, ship) {
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
            actions = actions.concat(this.getAttackActions(turnTime, ship));
            if (actions.length === 0) {//damage ship only if it didn't attack
                actions = actions.concat(this.getDamageShipActions(turnTime,
                    ship));
            }
            if (!this.distracted) {
                actions = actions.concat(
                    this.getShipControlActions(turnTime, ship)
                );
            }
        } else {
            shipWeapon = ship.getItemByID(this.chargingShipWeapon.weaponID);
            if (turnTime >= this.chargingShipWeapon.startingTime +
                    shipWeapon.chargeTime) {
                actions.push(new sh.actions.FireShipWeapon({
                    time: turnTime,
                    unitID: this.id,
                    weaponID: this.chargingShipWeapon.weaponID
                }));
            }
        }
        actions = actions.concat(this.getOrdersActions(turnTime, ship));

        return actions;
    },
    isEnemy: function(unit) {
        'use strict';
        return unit.ownerID !== this.ownerID;
    },
    isInRange: function(unit) {
        'use strict';
        return sh.v.distance(unit, this) <= this.attackRange;
    },
    cancelShipWeaponFire: function(ship) {
        'use strict';
        var weapon;
        if (this.chargingShipWeapon) {
            weapon = ship.getItemByID(this.chargingShipWeapon.weaponID);
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
        getAttackActions: function(turnTime, ship) {
            return _.map(this.parent(turnTime, ship), function(action) {
                action.damageDelay = 300;
                action.updateModelChanges();
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

/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../25_classes/50_ship'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';
    var Action, ModelChange;

    /**
     * A point in time in the Script in which a change in the model happens.
     * Each action has a modelChanges Array,
     * with the model changes made by that action.
     * @param {int} timeOffset The time in ms in which this change occurs,
     * relative to the action's time.
     * @param {Function} apply The function that would change stuff around.
     * @constructor
     * @param {Action} action The action that originated the model change.
     */
    ModelChange = function(timeOffset, apply, action) {
        this.type = 'change';
        if (timeOffset < 0) {
            throw 'ModelChange timeOffset can\'t be negative';
        }
        this.timeOffset = timeOffset;
        this.apply = function(ship) {
            //console.log('Applying change: ' + action.toString());
            apply(ship);
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
    sh.Action = sh.Jsonable.extendShared({
        time: 0,//ms
        modelChanges: [],
        init: function(json) {
            this.set('Action', ['time'], json);
        },
        /**
         * Sets the time updating the model changes;
         * @param {int} time
         */
        setTime: function(time) {
            this.time = time;
            _.invoke(this.modelChanges, 'updateTime');
        },
        addChange: function(timeOffset, callback) {
            this.modelChanges.push(new ModelChange(timeOffset, callback, this));
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
            this.set('Move', ['unitID', 'from', 'to', 'duration'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.addChange(0, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                if (unit && unit.isAlive()) {
                    unit.moving = {
                        dest: self.to,
                        arrivalTime: self.time + self.duration
                    };
                    unit.blocking = false;
                    //cancel weapon charging
                    unit.cancelShipWeaponFire();

                }
            });
            this.addChange(this.duration, function(ship) {
                var unit = ship.getUnitByID(self.unitID),
                    prev;
                if (unit && unit.isAlive()) {
                    prev = {x: unit.x, y: unit.y};
                    unit.y = self.to.y;
                    unit.x = self.to.x;
                    unit.moving = null;
                    unit.dizzy = true;//can't attack if just got there
                    unit.moveLock = null;
                    if (!sh.v.equal(prev, self.to)) {
                        ship.unitsMap.update();
                    }
                    //cancel weapon charging
                    unit.cancelShipWeaponFire();
                }
            });
            this.addChange(this.duration + 100, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                if (unit && unit.isAlive()) {
                    unit.dizzy = false;//now it can attack
                }
            });
        },
        toString: function() {
            return this.time + 'ms: Move ' + this.unitID + ' to ' +
                sh.v.str(this.to);
        }
    });

    sh.actions.LockInCombat = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('LockInCombat', ['unit1ID', 'unit2ID', 'tile'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(0,
                function(ship) {
                    var unit1 = ship.getUnitByID(self.unit1ID),
                        unit2 = ship.getUnitByID(self.unit2ID);
                    unit1.inCombat = {enemyID: unit2.id};
                    unit2.inCombat = {enemyID: unit1.id};
                }, this)];
        }
    });

    sh.actions.EndCombat = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('EndCombat', ['tile'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(0,
                function(ship) {
                    var units = ship.unitsMap.at(self.tile.x, self.tile.y);
                    _.each(units, function(u) {
                        if (u.inCombat) {
                            u.inCombat = false;
                        }
                    });
                }, this)];
        }
    });

    sh.actions.Attack = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            if (!json.damageDelay) {
                json.damageDelay = 0;
            }
            this.set('Attack',
                ['attackerID', 'receiverID', 'damage', 'duration',
                    'damageDelay'], json);
            if (this.damageDelay > this.duration) {
                throw 'Attack action\'s damage delay can\'t be more than the ' +
                    'duration';
            }
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.addChange(0, function(ship) {
                var attacker = ship.getUnitByID(self.attackerID);
                attacker.onCooldown = true;
            });
            this.addChange(self.damageDelay, function(ship) {
                var attacker = ship.getUnitByID(self.attackerID),
                    receiver = ship.getUnitByID(self.receiverID);
                if (attacker && attacker.isAlive() &&
                        receiver && receiver.isAlive()) {
                    receiver.hp -= self.damage;
                    //cancel weapon charging
                    receiver.cancelShipWeaponFire();
                    receiver.distracted = true;
                }
            });
            this.addChange(this.duration, function(ship) {
                var attacker = ship.getUnitByID(self.attackerID);
                if (attacker) {
                    attacker.onCooldown = false;
                }
            });
        },
        toString: function() {
            return this.time + 'ms: Attack ' + this.attackerID + ' -> ' +
                this.receiverID;
        }
    });

    /**
     * Makes a unit appear on board.
     * @type {*}
     */
    sh.actions.Summon = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('Summon', ['x', 'y', 'playerID', 'unitType'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(0,
                function(ship) {
                    var unit = new sh.units[self.unitType](
                            {ownerID: self.playerID}
                        ),
                        freePos = ship.closestTile(self.x, self.y, function(t) {
                            return t === sh.tiles.clear;
                        });
                    if (freePos) {
                        unit.x = freePos.x;
                        unit.y = freePos.y;
                        ship.addUnit(unit);
                    }
                }, this)];
        },
        toString: function() {
            return this.time + 'ms: Summon ' + this.unitType;
        }
    });

    sh.actions.DamageShip = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('DamageShip', ['unitID', 'tile', 'damage', 'cooldown'],
                json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.addChange(0, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                unit.onCooldown = true;
                ship.hp -= self.damage;
            });
            this.addChange(this.cooldown, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                if (unit) {
                    unit.onCooldown = false;
                }
            });
        },
        toString: function() {
            return this.time + 'ms: DamageShip, damage: ' + this.damage;
        }
    });

    sh.actions.DeclareWinner = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('DeclareWinner', ['playerID'], json);
        }
    });

    sh.actions.SetUnitProperty = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('SetUnitProperty', ['unitID', 'property', 'value'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [
                new ModelChange(0,
                    function(ship) {
                        var unit = ship.getUnitByID(self.unitID);
                        unit[self.property] = self.value;
                    }, this)];
        },
        toString: function() {
            return this.time + 'ms: SetUnitProperty (' + this.unitID + '): ' +
                this.property + ' = ' + this.value;
        }
    });

    sh.actions.FinishOrder = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('FinishOrder', ['unitID'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.addChange(0, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                unit.orders.shift();
            });
        }
    });

    sh.actions.BeginShipWeaponCharge = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('BeginShipWeaponCharge', ['unitID', 'weaponID',
                'chargeTime'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.addChange(0, function(ship) {
                var unit = ship.getUnitByID(self.unitID),
                    weapon = ship.getItemByID(self.weaponID);
                unit.chargingShipWeapon = {
                    weapon: weapon,
                    startingTime: self.time
                };
                weapon.chargedBy = unit;
            });
            this.addChange(self.chargeTime, function(ship) {
                //empty function to trigger getActions from
                //unit responsible for firing
            });
        }
    });

    sh.actions.FireShipWeapon = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('FireShipWeapon', ['unitID', 'weaponID'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [];
            this.addChange(0, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                ship.enemyHP -= ship.getItemByID(self.weaponID).damage;
                unit.cancelShipWeaponFire();
            });
        }
    });
}());

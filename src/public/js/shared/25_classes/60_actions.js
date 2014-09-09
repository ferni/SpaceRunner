/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../25_classes/55_battle'), _ = sh._;
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
    sh.Action = sh.Jsonable.extendShared({
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
         * @param changeArray [{{offset:int, label:string, changer:Function}}]
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
                        if (unit && unit.isAlive()) {
                            prev = {x: unit.x, y: unit.y};
                            unit.y = self.to.y;
                            unit.x = self.to.x;
                            unit.moving = null;
                            unit.dizzy = true;//can't attack if just got there
                            unit.moveLock = null;
                            if (!sh.v.equal(prev, self.to)) {
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
                sh.v.str(this.to);
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

    /**
     * Makes a unit appear on board.
     * @type {*}
     */
    sh.actions.Summon = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'Summon',
                properties: ['x', 'y', 'playerID', 'unitType'],
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
                        var unit = new sh.units[self.unitType](
                                {ownerID: self.playerID}
                            ),
                            ship = battle.ships[0],
                            freePos = ship.closestTile(self.x, self.y,
                                function(t) {
                                    return t === sh.tiles.clear;
                                });
                        if (freePos) {
                            unit.x = freePos.x;
                            unit.y = freePos.y;
                            ship.addUnit(unit);
                        }
                    }
                }
            ]);
        },
        toString: function() {
            return this.time + 'ms: Summon ' + this.unitType;
        }
    });

    sh.actions.DamageShip = sh.Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'DamageShip',
                properties: ['unitID', 'tile', 'damage', 'cooldown'],
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
                        unit.onCooldown = true;
                        battle.ships[0].hp -= self.damage;
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
                    changer: function(battle) {
                        //empty function: this change is here
                        //to trigger a getActions call from the
                        //unit responsible for firing.
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
                properties: ['unitID', 'weaponID'],
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
                        var unit = battle.getUnitByID(self.unitID),
                            shooterShip = unit.ship,
                            damagedShip = battle.ships[1];
                        damagedShip.hp -= shooterShip.getItemByID(self.weaponID).damage;
                        unit.cancelShipWeaponFire();
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
                properties: ['unitID', 'shipDestinationID'],
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
                            dest = battle.getShipByID(self.shipDestinationID);
                        unit.ship.removeUnit(unit);
                        dest.addUnit(unit);
                    }
                }
            ])
        }
    });
}());

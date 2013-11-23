/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../20_placement-rules'), _ = sh._;
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
     * @param {int} time The time in ms in which this change occurs.
     * @param {Function} apply The function that would change stuff around.
     * @constructor
     * @param {Action} action The action that originated the model change.
     */
    ModelChange = function(time, apply, action) {
        this.type = 'change';
        this.time = time;
        this.apply = apply;
        this.action = action;
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
    Action = sh.Jsonable.extendShared({
        time: 0,//ms
        modelChanges: [],
        init: function(json) {
            this.set('Action', ['time'], json);
        }
    });

    sh.actions = {};

    sh.actions.PrepareOrder = Action.extendShared({
        init: function(json) {
            var self = this;
            this.parent(json);
            this.set('PrepareOrder', ['unitID'], json);
            this.modelChanges = [new ModelChange(this.time, function(ship) {
                var unit = ship.getUnitByID(self.unitID);
                unit.orderState = 'prepared';
            }, this)];
        }
    });

    /**
     * The unit changes tiles.
     * @type {*}
     */
    sh.actions.Move = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('Move', ['unitID', 'from', 'to', 'duration'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [
                new ModelChange(this.time,
                    function(ship) {
                        var unit = ship.getUnitByID(self.unitID);
                        if (unit.isAlive()) {
                            unit.moving = {
                                dest: self.to,
                                arrivalTime: self.time + self.duration
                            };
                            unit.orderState = 'executing';
                            unit.blocking = false;
                        }
                    }, this),
                new ModelChange(this.time + this.duration,
                    function(ship) {
                        var unit = ship.getUnitByID(self.unitID),
                            prev;
                        if (unit.isAlive()) {
                            prev = {x: unit.x, y: unit.y};
                            unit.y = self.to.y;
                            unit.x = self.to.x;
                            unit.moving = null;
                            unit.dizzy = true;//can't attack if just got there
                            if (unit.orders.length > 0) {
                                unit.orderState = 'pending';
                            } else {
                                unit.orderState = 'allComplete';
                            }
                            if (!sh.v.equal(prev, self.to)) {
                                ship.unitsMap.update();
                            }
                        }
                    }, this),
                new ModelChange(this.time + this.duration + 100,
                    function(ship) {
                        var unit = ship.getUnitByID(self.unitID);
                        if (unit.isAlive()) {
                            unit.dizzy = false;//now it can attack
                        }
                    }, this)];
        }
    });

    sh.actions.LockInCombat = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('LockInCombat', ['unit1ID', 'unit2ID', 'tile'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
                function(ship) {
                    var unit1 = ship.getUnitByID(self.unit1ID),
                        unit2 = ship.getUnitByID(self.unit2ID);
                    unit1.inCombat = {enemyID: unit2.id};
                    unit2.inCombat = {enemyID: unit1.id};
                }, this)];
        }
    });

    sh.actions.EndCombat = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('EndCombat', ['tile'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
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

    sh.actions.Attack = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('Attack',
                ['attackerID', 'receiverID', 'damage', 'duration'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
                function(ship) {
                    var attacker = ship.getUnitByID(self.attackerID),
                        receiver = ship.getUnitByID(self.receiverID);
                    attacker.onCooldown = true;
                    if (attacker.isAlive() && receiver.isAlive()) {
                        receiver.hp -= self.damage;
                    }
                }, this),
                new ModelChange(this.time + this.duration, function(ship) {
                    var attacker = ship.getUnitByID(self.attackerID);
                    attacker.onCooldown = false;
                }, this)];
        }
    });

    /**
     * Makes a unit appear on board.
     * @type {*}
     */
    sh.actions.Summon = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('Summon', ['x', 'y', 'playerID', 'unitType'], json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
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
        }
    });

    sh.actions.DamageShip = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('DamageShip', ['unitID', 'tile', 'damage', 'cooldown'],
                json);
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [
                new ModelChange(this.time,
                    function(ship) {
                        var unit = ship.getUnitByID(self.unitID);
                        unit.onCooldown = true;
                        ship.hp -= self.damage;
                    }, this),
                new ModelChange(this.time + this.cooldown,
                    function(ship) {
                        var unit = ship.getUnitByID(self.unitID);
                        unit.onCooldown = false;
                    })];
        }
    });

    sh.actions.DeclareWinner = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('DeclareWinner', ['playerID'], json);
        }
    });
}());

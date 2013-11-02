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

    ModelChange = function(time, apply) {
        this.type = 'change';
        this.time = time;
        this.apply = apply;
    };
    sh.ModelChange = ModelChange;
    Action = sh.Jsonable.extendShared({
        time: 0,//ms
        modelChanges: [],
        init: function(json) {
            this.set(['time'], json);
        },
        applyChanges: function(ship) {
            //(abstract)
            return ship;
        }
    });

    sh.actions = {};
    /**
     * The unit starts walking.
     * @type {*}
     */
    sh.actions.Move = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set(['unitID', 'from', 'to', 'duration'], json);
            this.type = 'Move';
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time + this.duration,
                function(ship) {
                    var unit = ship.getUnitByID(self.unitID),
                        prev;
                    if (unit) { //is alive
                        prev = {x: unit.x, y: unit.y};
                        unit.y = self.to.y;
                        unit.x = self.to.x;
                        if (!sh.v.equal(prev, self.to)) {
                            ship.unitsMap.update();
                        }
                    }
                })];
        }
    });

    sh.actions.LockInCombat = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set(['unit1ID', 'unit2ID', 'tile'], json);
            this.type = 'LockInCombat';
        }
    });

    sh.actions.Attack = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set(['attackerID', 'receiverID', 'damage'], json);
            this.type = 'Attack';
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
                function(ship) {
                    var attacker = ship.getUnitByID(self.attackerID),
                        receiver = ship.getUnitByID(self.receiverID);
                    if (attacker && receiver) { //(both are alive)
                        receiver.hp -= self.damage;
                        if (receiver.hp <= 0) {
                            //unit dies
                            ship.removeUnit(receiver);
                        }
                    }
                })];
        }
    });

    /**
     * Makes a unit appear on board.
     * @type {*}
     */
    sh.actions.Summon = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set(['x', 'y', 'playerID', 'unitType'], json);
            this.type = 'Summon';
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
                function(ship) {
                    var unit = new sh.units[self.unitType](0, 0,
                            {owner: {id: self.playerID}}),
                        freePos = ship.closestTile(self.x, self.y, function(t) {
                            return t === sh.tiles.clear;
                        });
                    if (freePos) {
                        unit.x = freePos.x;
                        unit.y = freePos.y;
                        ship.addUnit(unit);
                    }
                })];
        }
    });

    sh.actions.DamageShip = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set(['tile', 'damage'], json);
            this.type = 'DamageShip';
            this.updateModelChanges();
        },
        updateModelChanges: function() {
            var self = this;
            this.modelChanges = [new ModelChange(this.time,
                function(ship) {
                    ship.hp -= self.damage;
                })];
        }
    });

    sh.actions.DeclareWinner = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.set(['playerID'], json);
            this.type = 'DeclareWinner';
        }
    });
}());

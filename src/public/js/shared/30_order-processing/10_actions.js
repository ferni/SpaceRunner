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

    ModelChange = function(time, entityType, entityID, props) {
        this.time = time;
        this.entityType = entityType;
        this.entityID = entityID;
        this.props = props;
    };

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
            this.modelChanges = [new ModelChange(this.time + this.duration,
                'Unit', this.unitID, {x: this.to.x, y: this.to.y})];
        },
        applyChanges: function(ship) {
            var unit = ship.getUnitByID(this.unitID);
            if (unit) { //is alive
                unit.y = this.to.y;
                unit.x = this.to.x;
            }
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
            this.modelChanges = [new ModelChange(this.time,
                'Unit', this.receiverID, {hp: '-' + this.damage})];
        },
        applyChanges: function(ship) {
            var attacker = ship.getUnitByID(this.attackerID),
                receiver = ship.getUnitByID(this.receiverID);
            if (attacker && receiver) { //(both are alive)
                receiver.hp -= this.damage;
                if (receiver.hp <= 0) {
                    //unit dies
                    ship.removeUnit(receiver);
                }
            }
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
        },
        applyChanges: function(ship) {
            var unit = new sh.units[this.unitType](0, 0,
                {owner: {id: this.playerID}}),
                freePos = ship.closestTile(this.x, this.y, function(tile) {
                    return tile === sh.tiles.clear;
                });
            if (freePos) {
                unit.x = freePos.x;
                unit.y = freePos.y;
                ship.addUnit(unit);
            }
        }
    });
}());

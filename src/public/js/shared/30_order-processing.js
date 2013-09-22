/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('./20_placement-rules'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';
    var Script, Action, pfFinder;

    Action = sh.SharedClass.extendShared({
        start: 0,//ms
        end: 0,//ms
        init: function(json) {
            this.start = json.start;
            this.end = json.end;
        },
        toJson: function() {
            return {
                start: this.start,
                end: this.end
            };
        }
    });

    sh.actions = {};
    sh.actions.Move = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.unitID = json.unitID;
            this.from = json.from;
            this.to = json.to;
            this.type = 'Move';
        },
        toJson: function() {
            var json = this.parent();
            json.unitID = this.unitID;
            json.from = this.from;
            json.to = this.to;
            json.type = 'Move';
            return json;
        }
    });

    sh.actions.Attack = Action.extendShared({
        init: function(json) {
            this.parent(json);
            this.attackerID = json.attackerID;
            this.receiverID = json.receiverID;
            this.damage = json.damage;
            this.type = 'Attack';
        },
        toJson: function() {
            var json = this.parent();
            json.attackerID = this.attackerID;
            json.receiverID = this.receiverID;
            json.damage = this.damage;
            json.type = 'Attack';
            return json;
        }
    });

    //ORDER VERIFICATION
    function verifyOrder(order, ship, playerID) {
        if (!order || !order.type || order.type !== 'Order-JSON-V1' ||
                !order.variant) {
            return false;
        }
        switch (order.variant) {
        case 'move':
            var dest = order.destination,
                unit = ship.getUnitByID(order.unitID);
            return unit &&
                //is destination a walkable area
                ship.isWalkable(dest.x, dest.y) &&
                //unit owned by the issuer
                unit.owner.id === playerID;
        default:
            return false;
        }
    }


    //SCRIPT GENERATION
    pfFinder = new sh.PF.AStarFinder({
        allowDiagonal: true
    });

    function getTileDistance(from, to) {
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
    }

    function isDiagonal(from, to) {
        var a = to.x - from.x,
            b = to.y - from.y;
        return a !== 0 && b !== 0;
    }

    function convertPathToActionsArray(path, unit) {
        var action,
            actions = [],
            i,
            oneTileTime = unit.getTimeForOneTile(),
            diagonalTime = oneTileTime * 1.41421356,
            tileDistance,
            step,
            time = 0; //in ms
        for (i = 1; i < path.length; i++, time += step) {
            action = new sh.actions.Move({
                unitID: unit.id,
                from: {
                    x: path[i - 1][0],
                    y: path[i - 1][1]
                },
                to: {
                    x: path[i][0],
                    y: path[i][1]
                },
                start: time
            });
            tileDistance = getTileDistance(action.from, action.to);
            if (isDiagonal(action.from, action.to)) {
                step = tileDistance * diagonalTime;
            } else {
                step = tileDistance * oneTileTime;
            }
            action.end = action.start + step;
            actions.push(action);
        }
        return actions;
    }

    function createActionsFromMoveOrder(order, unit, grid) {
        var dest = order.destination,
            path = pfFinder.findPath(unit.x, unit.y, dest.x, dest.y, grid);
        if (path.length > 0) {
            //generate the actions
            return convertPathToActionsArray(path, unit);
        }
        return [];
    }

    function willUnitMove(unitID, script, withinTurnObj) {
        var withinTurn = withinTurnObj.withinTurn;
        return _.any(script.byUnit[unitID], function(action) {
            return action instanceof sh.actions.Move &&
                (!withinTurn || script.isWithinTurn(action));
        });
    }

    function getActionsByUnit(actions) {
        var actionsByUnit = {};
        _.each(actions, function(action) {
            if (action.unitID !== undefined) {
                if (!actionsByUnit[action.unitID]) {
                    actionsByUnit[action.unitID] = [];
                }
                actionsByUnit[action.unitID].push(action);
            }
        });
        return actionsByUnit;
    }

    function fixActionsOverlap(actions) {
        var i, diff;
        for (i = 0; i < actions.length - 1; i++) {
            if (actions[i + 1].start < actions[i].end) {
                diff = actions[i].end - actions[i + 1].start;
                actions[i + 1].start += diff;
                actions[i + 1].end += diff;
            }
        }
    }

    function applySpeedModifiers(script, ship) {
        _.each(script.byUnit, function(actions, unitID) {
            var unit = ship.getUnitByID(unitID),
                changed = false;
            _.each(actions, function(action) {
                var others, duration;
                if (action instanceof sh.actions.Move) {
                    others = ship.unitsMap.at(action.from.x, action.from.y);
                    others = _.without(others, unit);
                    if (others &&
                        //there's only one unit...
                            others.length === 1 &&
                            //is enemy unit
                            others[0].owner.id !== unit.owner.id &&
                            //unit will stand still
                            !willUnitMove(others[0].id, script,
                                {withinTurn: false})) {

                        //apply %25 speed
                        duration = action.end - action.start;
                        duration *= 4;
                        action.end = action.start + duration;
                        changed = true;
                    }
                }
            });
            if (changed) {
                fixActionsOverlap(actions);
            }
        });
    }

    function insertDelay(actions, index, delay) {
        var i;
        for (i = index; i < actions.length; i++) {
            actions[i].start += delay;
            actions[i].end += delay;
        }
    }

    function getLastMoveAction(script, unit) {
        var moveActions = _.filter(script.byUnit[unit.id], function(a) {
            return a instanceof sh.actions.Move &&
                script.isWithinTurn(a);
        });
        if (moveActions && moveActions.length > 0) {
            return moveActions[moveActions.length - 1];
        }
        return null;
    }

    function getEndPosition(unit, script) {
        var lastMoveAction = getLastMoveAction(script, unit);
        return lastMoveAction ? lastMoveAction.to : {x: unit.x, y: unit.y};
    }

    function delayLastMovement(unit, script) {
        var actions = script.byUnit[unit.id],
            lastMoveAction = getLastMoveAction(script, unit);

        insertDelay(actions,
            actions.indexOf(lastMoveAction),
            script.turnDuration - lastMoveAction.start);
    }

    function fixEndOfTurnOverlap(script, ship) {
        var i, j, a, aPos, b, forChange, somethingChanged;
        do {
            somethingChanged = false;
            for (i = ship.units.length - 1; i >= 0; i--) {
                a = ship.units[i];
                aPos = getEndPosition(a, script);
                if (ship.itemsMap.at(aPos.x, aPos.y) instanceof sh.items.Door) {
                    delayLastMovement(a, script);
                    somethingChanged = true;
                }
                for (j = i - 1; j >= 0; j--) {
                    b = ship.units[j];
                    if (a.owner.id === b.owner.id &&//units are of the same team
                            _.isEqual(getEndPosition(a, script),
                                getEndPosition(b, script))) {
                        //same end position, one will need to change
                        if (willUnitMove(a.id, script,
                                {withinTurn: true})) {
                            //change a, since it's the one moving
                            forChange = a;
                        } else if (willUnitMove(b.id, script,
                                {withinTurn: true})) {
                            //change b, since it's the one moving
                            forChange = b;
                        } else {
                            throw 'Neither unit is moving yet they ended' +
                                ' up in the same position, something' +
                                ' has gone wrong...';
                        }
                        delayLastMovement(forChange, script);
                        somethingChanged = true;
                    }
                }
            }
        } while (somethingChanged);
    }

    Script = sh.SharedClass.extendShared({
        turnDuration: 0,
        actions: [],
        byUnit: {},
        init: function(parameters) {
            if (parameters) {
                this.actions = parameters.actions;
                this.turnDuration = parameters.turnDuration;
                this.sort();
            }
        },
        fromJson: function(json) {
            //logic here
            this.turnDuration = json.turnDuration;
            this.actions = _.map(json.actions, function(actionJson) {
                return new sh.actions[actionJson.type](actionJson);
            });
            this.byUnit = getActionsByUnit(json.actions);
            return this;
        },
        toJson: function() {
            return {
                turnDuration: this.turnDuration,
                actions: _.map(this.actions, function(action) {
                    return action.toJson();
                })
            };
        },
        isWithinTurn: function(action) {
            return action.end <= this.turnDuration;
        },
        sort: function() {
            this.actions = _.sortBy(this.actions, 'start');
            this.byUnit = getActionsByUnit(this.actions);
        },
        /**
         * Inserts an action maintaining their order
         * @param {Action} action The action to be inserted.
         */
        insertAction: function(action) {
            var insertionIndex = _.sortedIndex(this.actions, action, 'start');
            //TODO: insert into byUnit also
            this.actions.splice(insertionIndex, 0, action);
        }
    });

    /**
     * Gets an array describing how the position of a unit changes.
     * @param {Script} script
     * @param {sh.Unit} unit
     * @return {Array} Array of {pos, time}.
     */
    function getPositionsForUnit(script, unit) {
        var moveActions = _.filter(script.byUnit[unit.id], function(a) {
                return a instanceof sh.actions.Move;
            }),
            positions = [{
                pos: {x: unit.x, y: unit.y},
                time: 0
            }];
        _.each(moveActions, function(a) {
            if (!_.isEqual(a.to, _.last(positions).pos)) {
                positions.push({pos: {x: a.to.x, y: a.to.y},
                    time: a.end});
            }
        });
        return positions;
    }

    function getUnitsPositions(script, ship) {
        var unitsPositions = {};
        _.each(ship.units, function(unit) {
            unitsPositions[unit.id] = getPositionsForUnit(script, unit);
        });
        return unitsPositions;
    }

    /**
     * Gets an array of time periods (start, end, pos) for which
     * a unit is standing still.
     * @param {Script} script
     * @param {int} unitID
     * @return {Array} Array of {start, end, pos}
     */
    function getStandingPeriods(script, unitID) {
        var periods = [],
            newPeriod,
            action,
            i;
        if (script.byUnit[unitID].length > 0) {
            newPeriod = {start: 0,
                pos: script.byUnit[unitID][0].from};
        }
        //assumes the script is sorted
        for (i = 0; i < script.byUnit[unitID].length; i++) {
            action = script.byUnit[unitID][i];
            if (action instanceof sh.actions.Move) {
                newPeriod.end = action.start;
                if (newPeriod.start < newPeriod.end) {//(it's not the same)
                    periods.push(newPeriod);
                }
                newPeriod = {start: action.end,
                    pos: action.to};
            }
        }
        if (newPeriod.start < script.turnDuration) {
            newPeriod.end = script.turnDuration;
            periods.push(newPeriod);
        }
        return periods;
    }

    /**
     * Returns if there's any overlap between the two time periods.
     * @param {{start, end}} time1
     * @param {{start, end}} time2
     */
    function periodsOverlap(time1, time2) {
        if (time1.end < time1.start || time2.end < time2.start) {
            throw 'Argument not a valid window (end < than start)';
        }
        return ((time1.start < time2.end) && (time1.end > time2.start)) ||
                ((time2.start < time1.end) && (time2.end > time1.start));
    }

    /**
     * Returns an array of {start, end, unitID} for which other
     * units cross the current one at the given time period.
     * @param {Script} script
     * @param {Array} unitsPositions
     * @param {{x, y}} atPos
     * @param {{start, end}} atPeriod
     * @param {int} excludedID
     * @return {Array}
     */
    function getOverlaps(script, unitsPositions, atPos, atPeriod, excludedID) {
        var overlaps = [];
        _.each(unitsPositions, function(positions, unitID) {
            unitID = parseInt(unitID, 10);
            if (unitID === excludedID) {
                return;
            }
            _.each(positions, function(posAndTime, index) {
                var otherPeriod, nextPos = positions[index + 1];
                if (!_.isEqual(posAndTime.pos, atPos)) {
                    //if it's not the same position, it's not overlapping.
                    return;
                }
                otherPeriod = {
                    start: posAndTime.time,
                    end: nextPos ? nextPos.time : script.turnDuration
                };
                if (periodsOverlap(otherPeriod, atPeriod)) {
                    overlaps.push({
                        start: _.max([otherPeriod.start, atPeriod.start]),
                        end: _.min([otherPeriod.end, atPeriod.end]),
                        unitID: unitID
                    });
                }
            });
        });
        return overlaps;
    }

    function addAttackActions(script, ship) {
        var allUnitsPositions = getUnitsPositions(script, ship);
        _.each(ship.units, function(unit) {
            //The units attack when standing
            var standing = getStandingPeriods(script, unit.id),
                //time for which the next attack is due
                nextAttack = unit.lastAttack + unit.attackCooldown;
            _.each(standing, function(st) {
                var overlaps = getOverlaps(script, allUnitsPositions, st.pos,
                    st, unit.id),
                    overlapInAttackTime,
                    closestOverlap;
                if (overlaps.length === 0) {
                    return;
                }
                overlapInAttackTime = _.find(overlaps, function(o) {
                    return o.start <= nextAttack && o.end >= nextAttack;
                });
                if (!overlapInAttackTime) {
                    closestOverlap = _.min(_.filter(overlaps, function(o) {
                        return o.start >= nextAttack;
                    }), 'start');
                    nextAttack = overlapInAttackTime.start;
                }

                //add attack

                unit.lastAttack = nextAttack;
                nextAttack += unit.attackCooldown;
            });
        });
    }

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param {Array} orders
     * @param {sh.Ship} ship
     * @param {int} turnDuration
     * @return {Script}
     */
    function createScript(orders, ship, turnDuration) {
        //make it async in the future
        var script,
            actions = [],
            grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix());

        _.each(orders, function(order) {
            var unit = ship.getUnitByID(order.unitID);
            switch (order.variant) {
            case 'move':
                    //this assumes the orders array is ordered by orders given
                actions = actions.concat(createActionsFromMoveOrder(
                    order,
                    unit,
                    grid.clone()
                ));
                break;
            }
        });
        script = new Script({actions: actions, turnDuration: turnDuration});
        applySpeedModifiers(script, ship);
        script.sort();
        fixEndOfTurnOverlap(script, ship);
        script.sort();
        return script;
    }

    /**
     * Modifies the ship and its elements according with the script given
     * and the time.
     * @param {sh.Ship} ship
     * @param {Script} script
     */
    function updateShipByScript(ship, script) {
        _.each(script.actions, function(action) {
            var unit;
            if (script.isWithinTurn(action)) {
                //this assumes the action involves a unit
                unit = ship.getUnitByID(action.unitID);
                unit.x = action.to.x;
                unit.y = action.to.y;
            }
        });
        ship.unitsMap.update();
    }

    //Export

    sh.verifyOrder = verifyOrder;
    sh.Script = Script;
    sh.createScript = createScript;
    sh.updateShipByScript = updateShipByScript;
    //also: sh.actions

    //Exported for testing
    sh.forTesting.fixEndOfTurnOverlap = fixEndOfTurnOverlap;
    sh.forTesting.fixActionsOverlap = fixActionsOverlap;
    sh.forTesting.getPositionsForUnit = getPositionsForUnit;
    sh.forTesting.getUnitsPositions = getUnitsPositions;
    sh.forTesting.getStandingPeriods = getStandingPeriods;
    sh.forTesting.getOverlaps = getOverlaps;

}());

/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global ko, _, gs, sh, $, utils, OrderVMTimeline, UnitVMTimeline*/

var Timeline = function(screen) {
    'use strict';
    var self = this,
        markerProximityThreshold = 5,//pixels
        markersTemp = [],
        Segment = function(timeline) {
            this.height = ko.computed(function() {
                return ((100 * timeline.zoomLevel()) - 2) + 'px';
                //(-2 for border)
            });
        },
        orderVMsByUnit = {};
    function seg() {
        return new Segment(self);
    }
    this.featuredUnit = ko.observable(null);
    this.orderVMs = ko.computed(function() {
        var orderVMs;
        if (this.featuredUnit()) {
            orderVMs = orderVMsByUnit[this.featuredUnit().id];
            if (orderVMs.length === 1) {
                $('#unit-orders').sortable('disable');
            } else {
                $('#unit-orders').sortable('enable');
            }
            return orderVMs;
        }
        return [];
    }, this);
    this.setOrders = ko.observableArray([]);
    this.setOrders.subscribe(function(newOrders) {
        var unitOrders = new sh.UnitOrders({unitID: self.featuredUnit().id});
        unitOrders.array = newOrders;
        screen.newOrders(unitOrders.toJson());
    });
    this.removeOrder = function(orderVM) {
        sh.utils.removeFromArray(orderVM.m, self.featuredUnit().orders);
        screen.newOrders(self.featuredUnit().makeUnitOrders().toJson());
    };
    this.zoomLevel = ko.observable(1);
    this.turns = [
        {
            separatorLabel: 'Now',
            segments: [seg(), seg(), seg(), seg()],
            top: function() {return '-1px'; }
        },
        {
            separatorLabel: 'Next',
            segments: [seg(), seg(), seg(), seg()],
            top: ko.computed(function() {
                return ((400 * self.zoomLevel()) - 1) + 'px';
            })
        }
    ];
    this.markers = ko.observableArray([]);

    function updateOrderVMsDuration(finishOrderActions) {
        //hack for unit with one order that never finishes, part 1
        _.each(orderVMsByUnit, function(orderVMs) {
            if (orderVMs.length === 1) {
                orderVMs[0].timeInfo({});
            }
        });
        //end of hack part 1

        _.chain(finishOrderActions)
            .groupBy('unitID')
            .each(function(finishOrderActions, unitID) {
                var orderVMs = orderVMsByUnit[unitID],
                    prevTime = 0,
                    lastIndex = 0;
                _.each(finishOrderActions, function(finish, index) {
                    orderVMs[index].timeInfo({
                        start: prevTime,
                        end: finish.time
                    });
                    prevTime = finish.time;
                    lastIndex = index;
                });
                if (orderVMs[lastIndex + 1]) {
                    orderVMs[lastIndex + 1].timeInfo({
                        start: prevTime,
                        end: 8200//beyond next turn
                    });
                }
            });

        //hack for unit with one order that never finishes, part 2
        _.each(orderVMsByUnit, function(orderVMs) {
            if (orderVMs.length === 1 &&
                    orderVMs[0].timeInfo().start === undefined) {
                orderVMs[0].timeInfo({
                    start: 0,
                    end: 8200
                });
            }
        });
        //end of hack part 2
    }

    function clearMarkers() {
        markersTemp = [];
        self.markers([]);
    }

    function Marker(time, color, legend) {
        this.time = time;
        this.pixelPos = ko.computed(function() {
            return (time / 10 * self.zoomLevel());
        });
        this.top = ko.computed(function() {
            return (this.pixelPos() - 2) + 'px';
        }, this);
        this.color = color;
        this.legend = legend;
    }

    function placeAttackMarker(attackAction) {
        var attacker = gs.battle.getUnitByID(attackAction.attackerID),
            receiver = gs.battle.getUnitByID(attackAction.receiverID);
        if (attacker && receiver) {
            markersTemp.push(new Marker(attackAction.time +
                attackAction.damageDelay, '#ED6F00', attacker.type +
                ' deals ' + attackAction.damage + 'dmg' + ' to ' +
                receiver.type));
        }
    }

    function placeDamageShipMarker(damageShipAction) {
        markersTemp.push(new Marker(damageShipAction.time, '#9C0000',
            'The ship receives ' +
            damageShipAction.damage + ' dmg'));
    }

    function placeFireShipWeaponMarker(fswAction) {
        var unit = gs.battle.getUnitByID(fswAction.unitID),
            damage = unit.ship.getItemByID(fswAction.weaponID).damage;
        markersTemp.push(new Marker(fswAction.time, 'blue',
            'Enemy ship receives ' +
            damage + ' dmg'));
    }

    function setRelativeActionTime(turn) {
        return function(a) {
            a.setTime(a.time + (turn * screen.turnDuration));
            return a;
        };
    }

    function updateOrderVMs(battle) {
        _.each(battle.getUnits(), function(unit) {
            var orderVMs = orderVMsByUnit[unit.id] = [];
            if (battle.orderCollection.getUnitOrders(unit.id)) {
                _.each(battle.orderCollection.getUnitOrders(unit.id).array,
                    function (order) {
                        orderVMs.push(new OrderVMTimeline(order, self, battle));
                    });
            }
        });
    }

    function cloneAction(action) {
        return new sh.actions[action.type](action.toJson());
    }

    function getPredictedActions(battle) {
        var script, i, newActions,
            turnsCovered = 2,
            actions = [],
            battleClone = new sh.Battle(battle.toJson());
        battleClone.insertOrders(battle.extractOrders());
        if (screen.scriptServer.pendingActionsJson) {
            battleClone.pendingActions = sh.utils.mapFromJson(
                screen.scriptServer.pendingActionsJson,
                sh.actions
            );
        }
        for (i = 0; i < turnsCovered; i++) {
            script = sh.createScript(battleClone.extractOrders().clone(),
                battleClone, true);
            newActions = script.actions;
            if (i !== turnsCovered - 1) { //is not last turn
                newActions = _.difference(script.actions,
                    battleClone.pendingActions);
            }
            actions = actions.concat(_.chain(newActions)
                .map(cloneAction)
                .map(setRelativeActionTime(i))
                .value());
        }
        return actions;
    }

    this.update = function() {
        var actionsByType = _.groupBy(getPredictedActions(gs.battle), 'type');
        updateOrderVMs(gs.battle);
        updateOrderVMsDuration(_.sortBy(actionsByType.FinishOrder, 'time'));
        this.featuredUnit.valueHasMutated();
        //Markers
        clearMarkers();
        _.each(actionsByType.Attack, placeAttackMarker);
        _.each(actionsByType.DamageShip, placeDamageShipMarker);
        _.each(actionsByType.FireShipWeapon, placeFireShipWeaponMarker);
        this.markers(_.sortBy(markersTemp, 'time'));
    };

    this.getHeight = function() {
        var segmentCount = 0;
        _.each(this.turns, function(t) {
            segmentCount += t.segments.length;
        });
        return segmentCount * 100;
    };

    this.getMarkersNear = function(pixelY) {
        return _.filter(self.markers(), function(m) {
            return m.pixelPos() <= pixelY + markerProximityThreshold &&
                m.pixelPos() >= pixelY - markerProximityThreshold;
        });
    };
};

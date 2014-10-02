/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global ko, _, gs, sh, $, utils, OrderVMTimeline, UnitVMTimeline*/

var Timeline = function(screen, startingBattle) {
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
    this.featuredUnitVM = ko.computed(function() {
        if (this.featuredUnit()) {
            return new UnitVMTimeline(this.featuredUnit(), this, this.battle);
        }
        return null;
    }, this);
    this.orderVMs = ko.computed(function() {
        if (this.featuredUnit()) {
            return orderVMsByUnit[this.featuredUnit().id];
        }
        return [];
    }, this);
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
        var attacker = self.battle.getUnitByID(attackAction.attackerID),
            receiver = self.battle.getUnitByID(attackAction.receiverID);
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
        var unit = self.battle.getUnitByID(fswAction.unitID),
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
            _.each(screen.currentOrders.orders[unit.id], function(order) {
                orderVMs.push(new OrderVMTimeline(order, self, battle));
            });
        });
    }



    this.update = function() {
        return;
        var battleClone, script, actionsByType, i, actions = [],
            turnsCovered = 2,
            newActions;
        if (!screen.resultingServerModel) {//first pause
            this.battle = startingBattle;
            battleClone = new sh.Battle(startingBattle.toJson());
        } else {
            this.battle = new sh.Battle(screen.resultingServerModel);
            battleClone = new sh.Battle(screen.resultingServerModel);
        }
        function cloneAction(action) {
            return new sh.actions[action.type](action.toJson());
        }

        battleClone.insertOrders(screen.currentOrders);
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



        actionsByType = _.groupBy(actions, 'type');
        updateOrderVMs(this.battle);
        updateOrderVMsDuration(_.sortBy(actionsByType.FinishOrder, 'time'));
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

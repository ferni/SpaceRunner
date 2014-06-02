/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global ko, _, gs, sh, $*/

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
        };
    function seg() {
        return new Segment(self);
    }
    this.zoomLevel = ko.observable(1);
    this.turns = [
        {
            separatorID: 'separator-now',
            separatorLabel: 'Now',
            segments: [seg(), seg(), seg(), seg()]
        },
        {
            separatorID: 'separator-next',
            separatorLabel: 'Next',
            segments: [seg(), seg(), seg(), seg()]
        }
    ];
    this.markers = ko.observableArray([]);

    function updateOrderVMsDuration(finishOrderActions) {
        //hack for unit with one order that never finishes, part 1
        _.each(screen.shipVM.unitVMs, function(unitVM) {
            if (unitVM.orderVMs.length === 1) {
                unitVM.orderVMs[0].timeInfo({});
            }
        });
        //end of hack part 1

        _.chain(finishOrderActions)
            .groupBy('unitID')
            .each(function(finishOrderActions, unitID) {
                var unitVM = screen.shipVM.getUnitVMByID(unitID),
                    prevTime = 0,
                    lastIndex = 0;
                _.each(finishOrderActions, function(finish, index) {
                    unitVM.orderVMs[index].timeInfo({
                        start: prevTime,
                        end: finish.time
                    });
                    prevTime = finish.time;
                    lastIndex = index;
                });
                if (unitVM.orderVMs[lastIndex + 1]) {
                    unitVM.orderVMs[lastIndex + 1].timeInfo({
                        start: prevTime,
                        end: 8200//beyond next turn
                    });
                }
            });

        //hack for unit with one order that never finishes, part 2
        _.each(screen.shipVM.unitVMs, function(unitVM) {
            if (unitVM.orderVMs.length === 1 &&
                    unitVM.orderVMs[0].timeInfo().start === undefined) {
                unitVM.orderVMs[0].timeInfo({
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
        var attacker = gs.ship.getUnitByID(attackAction.attackerID),
            receiver = gs.ship.getUnitByID(attackAction.receiverID);
        markersTemp.push(new Marker(attackAction.time +
                attackAction.damageDelay, '#ED6F00', attacker.type +
            ' deals ' + attackAction.damage + 'dmg' + ' to ' + receiver.type));
    }

    function placeDamageShipMarker(damageShipAction) {
        markersTemp.push(new Marker(damageShipAction.time, '#9C0000',
            'The ship receives ' +
            damageShipAction.damage + ' dmg'));
    }

    function placeFireShipWeaponMarker(fswAction) {
        var damage = gs.ship.getItemByID(fswAction.weaponID).damage;
        markersTemp.push(new Marker(fswAction.time, 'blue',
            'Enemy ship receives ' +
            damage + ' dmg'));
    }

    this.update = function() {
        var resultingShip = gs.ship.clone(),
            script = sh.createScript(gs.ship.extractOrders(),
                resultingShip, screen.turnDuration * 2),
            actionsByType = _.groupBy(script.actions, 'type');
        updateOrderVMsDuration(actionsByType.FinishOrder);
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



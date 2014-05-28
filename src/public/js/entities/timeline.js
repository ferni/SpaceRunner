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
        turnDurationSec = screen.turnDuration / 1000;
    function Segment(second, turn) {
        this.markers = ko.observableArray([]);
        this.second = second;
        this.turn = turn;
        this.totalSeconds = second * turn;
    }
    this.turns = [
        {
            separatorID: 'separator-now',
            separatorLabel: 'Now',
            segments: []
        },
        {
            separatorID: 'separator-next',
            separatorLabel: 'Next',
            segments: []
        }
    ];
    _.each(this.turns, function(t, turnIndex) {
        var i;
        for (i = 1; i < 5; i++) {
            t.segments.push(new Segment(i, turnIndex + 1));
        }
    });
    this.selectedSegment = ko.observable(null);

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
        _.each(self.turns, function(t) {
            _.each(t.segments, function(s) {
                s.markers([]);
            });
        });
    }

    function placeMarker(time, color, legend) {
        var second = Math.floor(time / 1000),
            turnIndex = Math.floor(second / turnDurationSec),
            segmentIndex = second % turnDurationSec,
            turn = self.turns[turnIndex],
            segment;

        if (turn) {
            segment = turn.segments[segmentIndex];
            if (segment) {
                segment.markers.push({
                    time: time,
                    top: ((time % 1000) / 10) + 'px',
                    color: color,
                    legend: legend
                });
            } else {
                console.warn('Segment not found: ' + segmentIndex);
            }
        } else {
            console.warn('Turn not found: ' + turnIndex +
                '(time: ' + time + ')');
        }
    }

    function placeAttackMarker(attackAction) {
        var attacker = gs.ship.getUnitByID(attackAction.attackerID),
            receiver = gs.ship.getUnitByID(attackAction.receiverID);
        placeMarker(attackAction.time + attackAction.damageDelay, '#FC7600',
                attacker.type + ' deals ' + attackAction.damage + ' to ' +
                    receiver.type);
    }

    function placeDamageShipMarker(damageShipAction) {
        placeMarker(damageShipAction.time, '#9C0000', 'The ship receives ' +
            damageShipAction.damage + ' dmg.');
    }

    function placeFireShipWeaponMarker(fswAction) {
        var damage = gs.ship.getItemByID(fswAction.weaponID).damage;
        placeMarker(fswAction.time, 'blue', 'Enemy ship receives ' +
            damage + ' dmg.');
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
    };

    this.getHeight = function() {
        var segmentCount = 0;
        _.each(this.turns, function(t) {
            segmentCount += t.segments.length;
        });
        return segmentCount * 100;
    };
};



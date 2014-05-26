/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global ko, _, gs, sh*/

var Timeline = function(screen) {
    'use strict';
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

    return {
        update: function() {
            var resultingShip = gs.ship.clone(),
                script = sh.createScript(gs.ship.extractOrders(),
                    resultingShip, screen.turnDuration * 2),
                actionsByType = _.groupBy(script.actions, 'type');
            updateOrderVMsDuration(actionsByType.FinishOrder);
        }
    };
};



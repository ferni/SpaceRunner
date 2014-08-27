/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global require, exports, module*/
var sh = require('../25_classes/50_ship'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

sh.Battle = sh.Jsonable.extendShared({
    ships: [],
    init: function(json) {
        this.setJson({
            type: 'Battle',
            properties: ['id', 'turnDuration'],
            json: json
        });
        this.ships = _.map(json.ships, function(shipJson) {
            var ship = new sh.Ship({json: shipJson});
            ship.battle = this;
            return ship;
        }, this);
        this.players = _.map(json.players, function(playerJson) {
            return new sh.Player(playerJson);
        });
        this.pendingActions = [];
    },
    toJson: function() {
        var json = this.parent();
        json.ships = sh.utils.mapToJson(this.ships);
        json.players = sh.utils.mapToJson(this.players);
        return json;
    },
    /**
     *@return Array Objects that have the .getActions method.
     */
    getActors: function() {
        return this.getUnits();
    },
    getUnits: function() {
        return _.flatten(_.pluck(this.ship, 'units'));
    },
    getUnitByID: function(id) {
        'use strict';
        return _.find(this.getUnits(), function(u) {
            return u.id === parseInt(id, 10);
        });
    },
    assignUnitID: function(unit) {
        var units = this.getUnits();
        if (units.length === 0) {
            unit.id = 1;
            return;
        }
        unit.id = _.max(units, function(e) {
            return e.id;
        }).id + 1;
    },
    extractOrders: function() {
        'use strict';
        var orders = {};
        _.each(this.getUnits(), function(u) {
            orders[u.id] = sh.utils.mapToJson(u.orders);
        });
        return orders;
    },
    insertOrders: function(orders) {
        'use strict';
        var self = this;
        _.each(orders, function(unitOrders) {
            var unit;
            if (unitOrders.length <= 0) {
                return;
            }
            unit = self.getUnitByID(unitOrders[0].unitID);
            unit.orders = sh.utils.mapFromJson(unitOrders, sh.orders);
        });
    },
    endOfTurnReset: function(turnDuration) {
        'use strict';
        _.invoke(this.ships, 'endOfTurnReset', turnDuration);
    }
});
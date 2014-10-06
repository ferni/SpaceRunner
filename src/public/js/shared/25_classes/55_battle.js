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
    changeHandlers: [],
    arbiter: {//actor that declares a winner
        type: 'Arbiter',
        getActions: function(turnTime, battle) {
            'use strict';
            if (battle.winner !== undefined) {
                return [];//winner already declared
            }
            var shipsByStatus = _.groupBy(battle.ships, function(ship) {
                return ship.hp <= 0 ? 'destroyed' : 'alive';
            });

            if (shipsByStatus.destroyed) {
                if (shipsByStatus.alive) {
                    return [new sh.actions.DeclareWinner({
                        playerID: shipsByStatus.alive[0].owner.id
                    })];
                }
                //all ships destroyed... (draw?)
            }
            return [];
        }
    },
    init: function(json) {
        'use strict';
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
        this.orderCollection = new sh.OrderCollection();
    },
    changed: function(unitOrders) {
        'use strict';
        //notify
        this.changeHandlers.forEach(function(handler) {
            handler(unitOrders);
        });
    },
    toJson: function() {
        'use strict';
        var json = this.parent();
        json.ships = sh.utils.mapToJson(this.ships);
        json.players = sh.utils.mapToJson(this.players);
        return json;
    },
    addShip: function(ship) {
        'use strict';
        ship.battle = this;
        ship.id = this.ships.length + 1;
        this.ships.push(ship);
    },
    getShipByID: function(id) {
        'use strict';
        return _.findWhere(this.ships, {id: id});
    },
    getPlayers: function() {
        'use strict';
        return _.pluck(this.ships, 'owner');
    },
    /**
     *@return Array Objects that have the .getActions method.
     */
    getActors: function() {
        'use strict';
        var actors = this.getUnits();
        actors.push(this.arbiter);
        return actors;
    },
    getUnits: function() {
        'use strict';
        return _.flatten(_.pluck(this.ships, 'units'));
    },
    getUnitByID: function(id) {
        'use strict';
        id = parseInt(id, 10);
        return _.findWhere(this.getUnits(), {id: id});
    },
    assignUnitID: function(unit) {
        'use strict';
        var units = this.getUnits();
        if (units.length === 0) {
            unit.id = 1;
            return;
        }
        unit.id = _.max(units, function(e) {
            return e.id;
        }).id + 1;
    },
    /**
     * Gets the orders from all the units as an sh.OrderCollection
     * @returns {sh.OrderCollection}
     */
    extractOrders: function() {
        'use strict';
        return this.orderCollection;
    },
    /**
     * Distribute the orders among the units.
     * @param orderCollection {sh.OrderCollection}
     */
    insertOrders: function(orderCollection) {
        'use strict';
        var self = this;
        _.each(orderCollection.allUnitOrders, function(unitOrders) {
            self.addUnitOrders(unitOrders);
        });
    },
    addUnitOrders: function(unitOrders) {
        'use strict';
        this.orderCollection.addUnitOrders(unitOrders);
        this.getUnitByID(unitOrders.unitID).orders = unitOrders.array;
        this.changed(unitOrders);
    },
    endOfTurnReset: function() {
        'use strict';
        _.invoke(this.ships, 'endOfTurnReset', this.turnDuration);
    },
    getPlayerShips: function(player) {
        'use strict';
        return _.filter(this.ships, function(ship) {   
            return ship.owner === player;
        });
    },
    getEnemyShips: function(player) {
        'use strict';
        return _.filter(this.ships, function(ship) {   
            return ship.owner !== player;
        });
    }
});
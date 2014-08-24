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
            properties: [],
            json: json
        });
        this.ships = _.map(json.ships, function(shipJson) {
            return new sh.Ship({json: shipJson});
        });
        this.players = _.map(json.players, function(playerJson) {
            return new sh.Player(playerJson);
        });
    },
    toJson: function() {
        var json = this.parent();
        json.ships = _.utils.mapToJson(this.ships);
        json.players = _.utils.mapToJson(this.players);
        return json;
    },
    /**
     *@return Array Objects that have the .getActions method.
     */
    getActors: function() {
        return _.flatten(_.pluck(this.ship, 'units'));
    }
});
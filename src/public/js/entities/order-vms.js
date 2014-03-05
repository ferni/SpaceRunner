/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, TILE_SIZE*/

var orderVMs = (function() {
    'use strict';
    var orderVMs = {},
        OrderVM;
    OrderVM = TileEntityVM.extend({
        init: function(order, image) {
            var pos;
            this.m = order;
            pos = this.getMarkerTile();
            this.parent(pos.x, pos.y, {image: image,
                spritewidth: TILE_SIZE, spriteheight: TILE_SIZE});
        },
        getMarkerTile: function() {
            throw 'getMarkerTile not implemented in ' + this.m.type + ' order.';
        }
    });

    orderVMs.Move = OrderVM.extend({
        init: function(order) {
            this.parent(order, 'marker-green');
        },
        getMarkerTile: function() {
            return this.m.destination;
        }
    });
    return orderVMs;
}());

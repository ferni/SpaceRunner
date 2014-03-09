/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, TILE_SIZE, _, gs, me, utils*/

var orderVMs = (function() {
    'use strict';
    var orderVMs = {},
        OrderVM;
    OrderVM = TileEntityVM.extend({
        init: function(order, image) {
            var pos;
            this.m = order;
            this.unitVM = me.state.current().shipVM.getUnitVMByID(order.unitID);
            pos = this.getMarkerTile();
            this.isSelectable = true;
            this.parent(pos.x, pos.y, {image: image,
                spritewidth: TILE_SIZE, spriteheight: TILE_SIZE,
                name: 'order'});
        },
        getMarkerTile: function() {
            throw 'getMarkerTile not implemented in ' + this.m.type + ' order.';
        },
        onSelected: function() {
            this.parent();
            //deselect the rest of the orders and units
            _.chain(gs.selected)
                .filter(function(tileEntity) {
                    return tileEntity !== this &&
                        tileEntity !== this.unitVM;
                }, this)
                .invoke('deselect');
            this.unitVM.select();
        },
        updatePos: function() {
            var tile = this.getMarkerTile();
            this.setX(tile.x);
            this.setY(tile.y);
        },
        hide: function() {
            this.parent();
            this.alpha = 0.5;
            this.isSelectable = true;
        }
    });

    orderVMs.Move = OrderVM.extend({
        init: function(order) {
            this.parent(order, 'marker-green');
        },
        getMarkerTile: function() {
            return this.m.destination;
        },
        onMouseDown: function() {
            this.parent();
            me.state.current().dragging = this;
        },
        update: function() {
            this.parent();
            if (me.state.current().dragging === this) {
                utils.setCursor('move');
            }
            return true;
        }
    });

    orderVMs.SeekAndDestroy = OrderVM.extend({
        init: function(order) {
            this.parent(order, 'marker-red');
        },
        getMarkerTile: function() {
            return gs.ship.getUnitByID(this.m.targetID);
        }
    });

    return orderVMs;
}());

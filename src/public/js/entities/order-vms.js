/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, TILE_SIZE, _, gs, me, utils, HALF_TILE*/

var orderVMs = (function() {
    'use strict';
    var orderVMs = {},
        OrderVM;
    OrderVM = TileEntityVM.extend({
        isPreview: false,
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
        updatePath: function(from, to, ship) {
            this.path = this.m.getPath(from, to, ship);
        },
        draw: function(ctx) {
            this.parent(ctx);

            if (!this.path) {
                return;
            }
            var from = this.path[0];
            ctx.beginPath();
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'blue';
            _.each(this.path, function(pos) {
                ctx.moveTo((from[0] * TILE_SIZE) + HALF_TILE,
                        (from[1] * TILE_SIZE) + HALF_TILE);
                ctx.lineTo((pos[0] * TILE_SIZE) + HALF_TILE,
                        (pos[1] * TILE_SIZE) + HALF_TILE);
                from = pos;
            });
            ctx.stroke();
            ctx.restore();
        }
    });

    orderVMs.Move = OrderVM.extend({
        lightColor: '#00AA00',//for the lines
        darkColor: '#006000',
        init: function(order) {
            this.parent(order, 'marker-green');
        },
        getMarkerTile: function() {
            return this.m.destination;
        },
        onMouseDown: function() {
            this.parent();
            if (!this.isPreview && !this.hidden()) {
                me.state.current().dragging = this;
            }
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
        lightColor: '#CC0000',//for the lines
        darkColor: '#500000',
        init: function(order) {
            this.parent(order, 'marker-red');
        },
        getMarkerTile: function() {
            return gs.ship.getUnitByID(this.m.targetID);
        }
    });

    return orderVMs;
}());

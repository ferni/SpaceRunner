/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me*/

var TileEntityVM = require('client/tile-entity-vm'),
    _ = require('underscore'),
    gs = require('client/game-state'),
    utils = require('client/utils'),
    draw = require('client/draw'),
    sh = require('shared');

module.exports = (function() {
    'use strict';
    var orderVMs = {},
        OrderVM;
    OrderVM = TileEntityVM.extend({
        isPreview: false,
        init: function(order) {
            var pos;
            this.m = order;
            this.unitVM = me.state.current().shipVM.getUnitVMByID(order.unitID);
            pos = this.getMarkerTile();
            this.isSelectable = true;
            this.parent(pos.x, pos.y, {image: 'markers',
                spritewidth: gs.TILE_SIZE, spriteheight: gs.TILE_SIZE,
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
            if (tile !== undefined) {
                this.setX(tile.x);
                this.setY(tile.y);
            }
        },
        setX: function(x) {
            var posChanged = x !== this.x,
                returns = this.parent(x);
            if (posChanged) {
                this.onPosChanged();
            }
            return returns;
        },
        setY: function(y) {
            var posChanged = y !== this.y,
                returns = this.parent(y);
            if (posChanged) {
                this.onPosChanged();
            }
            return returns;
        },
        onPosChanged: function() {
            var vms,
                nextOrder;
            this.updatePath();
            vms = this.unitVM.orderVMs;
            nextOrder = vms[_.indexOf(vms, this) + 1];
            if (nextOrder) {
                nextOrder.updatePath();
            }
        },
        updatePath: function() {
            var from, index, vms = this.unitVM.orderVMs;
            if (vms[0] === this) {
                from = this.unitVM.m;
            } else {
                index = _.indexOf(vms, this);
                if (index !== -1) {
                    from = vms[index - 1];
                } else {
                    from = vms.length === 0 ? this.unitVM.m :
                            _.last(vms);
                }
            }
            this.path = this.m.getPath(from, this, gs.ship);
        },
        draw: function(ctx) {
            this.parent(ctx);
            if (!this.path) {
                return;
            }
            var from = this.path[0];
            ctx.beginPath();
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.lightColor;
            ctx.globalAlpha = this.alpha;
            if (ctx.setLineDash) {
                ctx.setLineDash([4, 4]);
                if (!this.hidden()) {
                    ctx.lineDashOffset = draw.getLineDashOffset();
                }
            }
            _.each(this.path, function(pos) {
                ctx.moveTo((from[0] * gs.TILE_SIZE) + gs.HALF_TILE,
                        (from[1] * gs.TILE_SIZE) + gs.HALF_TILE);
                ctx.lineTo((pos[0] * gs.TILE_SIZE) + gs.HALF_TILE,
                        (pos[1] * gs.TILE_SIZE) + gs.HALF_TILE);
                from = pos;
            });
            ctx.stroke();
            ctx.restore();
        },
        convertToPreview: function() {
            this.isPreview = true;
            this.isSelectable = false;
            this.alpha = 0.85;
        },
        hide: function() {
            this.parent();
            this.alpha = 0.4;
        },
        remove: function() {
            var unitOrders = this.unitVM.m.orders;
            sh.utils.removeFromArray(this.m, unitOrders);
            this.unitVM.updateOrderVMs();
        }
    });

    orderVMs.Move = OrderVM.extend({
        lightColor: '#00AA00',//for the path lines
        itemColor: '#008000', //for the timeline
        init: function(order) {
            this.parent(order);
            this.addAnimation('default', [1]); //green marker
            this.setCurrentAnimation('default');
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

    orderVMs.MoveToConsole = orderVMs.Move.extend({
        lightColor: '#0A4CA8',
        itemColor: '#000080',
        init: function(order) {
            this.parent(order);
            this.addAnimation('default', [2]); //blue marker
            this.setCurrentAnimation('default');
        }
    });

    orderVMs.SeekAndDestroy = OrderVM.extend({
        lightColor: '#CC0000',
        itemColor: '#800000',
        init: function(order) {
            this.parent(order);
            this.addAnimation('default', [0]); //red marker
            this.setCurrentAnimation('default');
            this.targetVM = me.state.current().shipVM
                .getUnitVMByID(this.m.targetID);
        },
        getMarkerTile: function() {
            return gs.ship.getUnitByID(this.m.targetID);
        },
        update: function() {
            if (!sh.v.equal(this.prevTargetPos, this.targetVM.m)) {
                this.updatePos();
                this.prevTargetPos = {x: this.targetVM.m.x,
                    y: this.targetVM.m.y};
            }
        }
    });
    return orderVMs;
}());

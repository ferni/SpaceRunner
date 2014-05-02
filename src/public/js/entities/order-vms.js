/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, TILE_SIZE, _, gs, me, utils, HALF_TILE, draw, sh*/

var orderVMs = (function() {
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
        setX: function(x) {
            var shouldUpdatePath = x !== this.x,
                returns = this.parent(x),
                orderVMs,
                nextOrder;
            if (shouldUpdatePath) {
                this.updatePath();
                orderVMs = this.unitVM.orderVMs;
                nextOrder = orderVMs[_.indexOf(orderVMs, this) + 1];
                if (nextOrder) {
                    nextOrder.updatePath();
                }
            }
            return returns;
        },
        setY: function(y) {
            var shouldUpdatePath = y !== this.y,
                returns = this.parent(y);
            if (shouldUpdatePath) {
                this.updatePath();
            }
            return returns;
        },
        updatePath: function() {
            var from, index, orderVMs = this.unitVM.orderVMs;
            if (orderVMs[0] === this) {
                from = this.unitVM.m;
            } else {
                index = _.indexOf(orderVMs, this);
                if (index !== -1) {
                    from = orderVMs[index - 1];
                } else {
                    from = orderVMs.length === 0 ? this.unitVM.m :
                            _.last(orderVMs);
                }
            }
            this.path = this.m.getPath(from, this, gs.ship);
        },
        draw: function(ctx) {
            this.parent(ctx);
            if (this.hidden()) {
                return;
            }
            if (!this.path) {
                return;
            }
            var from = this.path[0];
            ctx.beginPath();
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = this.lightColor;
            if (ctx.setLineDash) {
                ctx.setLineDash([4, 4]);
            }
            _.each(this.path, function(pos) {
                ctx.moveTo((from[0] * TILE_SIZE) + HALF_TILE,
                        (from[1] * TILE_SIZE) + HALF_TILE);
                if (ctx.setLineDash) {
                    ctx.lineDashOffset = draw.getLineDashOffset();
                }
                ctx.lineTo((pos[0] * TILE_SIZE) + HALF_TILE,
                        (pos[1] * TILE_SIZE) + HALF_TILE);
                from = pos;
            });
            ctx.stroke();
            ctx.restore();
        },
        convertToPreview: function() {
            this.isPreview = true;
            this.isSelectable = false;
            this.alpha = 0.7;
        }
    });

    orderVMs.Move = OrderVM.extend({
        lightColor: '#00AA00',//for the lines
        darkColor: '#006000',
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
        lightColor: '#0A4CA8',//for the lines
        darkColor: '#051936',
        init: function(order) {
            this.parent(order);
            this.addAnimation('default', [2]); //blue marker
            this.setCurrentAnimation('default');
        }
    });

    orderVMs.SeekAndDestroy = OrderVM.extend({
        lightColor: '#CC0000',//for the lines
        darkColor: '#500000',
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

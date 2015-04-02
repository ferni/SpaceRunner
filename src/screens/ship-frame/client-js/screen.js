/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, me, module, $*/

var gs = require('client/game-state'),
    sh = require('shared'),
    ShipVM = require('./ship-vm'),
    KeyManagerFrame = require('./key-manager-frame'),
    ScriptPlayer = require('./script-player'),
    utils = require('client/utils'),
    _ = require('underscore')._,
    draw = require('client/draw'),
    ui = require('client/ui'),
    orderVMs = require('./order-vms');

module.exports = me.ScreenObject.extend({
    currentTurnID: null,
    scriptPlayer: null,
    scriptServer: [],
    mouseDownPos: null,
    init: function() {
        'use strict';
        this.parent(true);
    },
/**
     *
     * @param {sh.Battle} battle
     * @param {int} shipID
     * @param {Object} orders
     */
    onResetEvent: function(battle, shipID, orders) {
        'use strict';
        var self = this;
        this.id = battle.id;
        this.turnDuration = battle.turnDuration;
        gs.battle = battle;
        gs.ship = _.findWhere(battle.ships, {id: shipID});
        console.log('Battle id is ' + this.id);
        window.addEventListener('message', function(event) {
            var data = event.data,
                unitVM;
            if (data.type === 'UnitOrders') {
                gs.battle.addUnitOrders(new sh.UnitOrders(data));
                unitVM = self.shipVM.getUnitVMByID(data.unitID);
                if (unitVM) {
                    unitVM.updateOrderVMs();
                }
            }
        }, false);
        this.shipVM = new ShipVM(gs.ship);
        this.shipVM.showInScreen();
        this.shipVM.update();
        this.scriptPlayer = new ScriptPlayer(this);
        this.keys = new KeyManagerFrame();
        this.keys.bind(me.input.KEY.ESC, function() {
            console.log('FRAME ESC');
            _.invoke(gs.selected.slice(0), 'deselect');
            self.previewOrders = {};
        });
        this.keys.bind(me.input.KEY.D, function() {
            console.log('FRAME DELETE');
            _.chain(gs.selected)
                .where({name: 'order'})
                .each(function(orderVM) {
                    orderVM.deselect();
                    orderVM.remove();
                    self.sendUnitOrders(orderVM.unitVM.m);
                });
        });
        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport,
            this.mouseMove.bind(this));

        this.pause();

        if (orders) {
            battle.insertOrders(orders);
        }
        //orders shown for each unit when moving the mouse around
        this.previewOrders = {};
        this.prevMouse = {x: 0, y: 0};

    },
    onDestroyEvent: function() {
        'use strict';
        this.keys.unbindAll();
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
    },
    runScript: function(script) {
        'use strict';
        this.scriptPlayer.loadScript(script);
        this.shipVM.update();
        this.resume();
    },
    update: function() {
        'use strict';
        this.parent();
        if (!this.paused) {
            var elapsed = me.timer.getTime() - this.turnBeginTime;
            this.elapsed = elapsed;
            this.shipVM.update();
            this.scriptPlayer.update(elapsed);
        } else {
            this.keys.processBindings();
        }
        return true;
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        if (this.paused) {
            if (this.dragBox) {
                this.dragBox.draw(ctx);
                utils.setCursor('crosshair');
            }
            _.invoke(this.previewOrders, 'draw', ctx);
        }
    },
    mouseDown: function(e) {
        'use strict';
        var which = e.which - 1; //workaround for melonJS mismatch
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.LEFT && !this.dragBox) {
            this.mouseDownPos = utils.getMousePx();
        }

    },
    mouseUp: function(e) {
        'use strict';
        var mouse = utils.getMouse(),
            which = e.which - 1, //workaround for melonJS mismatch
            draggedOriginalPos;
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.LEFT) {
            if (this.dragBox) {
                this.releaseDragBox();
            } else if (this.dragging) {//an order
                if (!sh.v.equal(this.dragging.m.destination, mouse)) {
                    draggedOriginalPos = this.dragging.m.destination;
                    this.dragging.m.destination = {x: mouse.x, y: mouse.y};
                    if (this.dragging.m.isValid(gs.battle, gs.player.id)) {
                        this.sendUnitOrders(this.dragging.unitVM.m);
                    } else {
                        this.dragging.m.destination = draggedOriginalPos;
                    }
                    this.dragging.updatePos();
                }
                this.dragging = null;
            } else {
                _.each(this.previewOrders, function(orderVM) {
                    this.sendUnitOrders(orderVM.unitVM.m, orderVM.m);
                }, this);
            }
            this.previewOrders = {};
            this.mouseDownPos = null;
        }
    },
    mouseMove: function() {
        'use strict';
        var mouse = utils.getMouse(),
            mousePx = utils.lastMousePx;
        if (this.dragging) {
            this.dragging.setX(mouse.x).setY(mouse.y);
            return;
        }
        if (this.dragBox) {
            this.dragBox.updateFromMouse(mousePx);
        } else if (this.mouseDownPos &&
                (this.mouseDownPos.x - mousePx.x > 5 ||
                mousePx.x - this.mouseDownPos.x > 5 ||
                this.mouseDownPos.y - mousePx.y > 5 ||
                mousePx.y - this.mouseDownPos.y > 5)) {
            //mouse exceeded 5 pixel threshold, start drag box.
            this.startDragBox(this.mouseDownPos);
            this.dragBox.updateFromMouse(mousePx);
        } else {
            if (sh.v.equal(mouse, this.prevMouse)) {
                return;
            }
            this.updatePreviewOrders(mouse);
        }
        this.prevMouse = mouse;
    },
    sendUnitOrders: function(unit, newOrder) {
        'use strict';
        var unitOrders = unit.makeUnitOrders();
        if (newOrder && newOrder.isValid(gs.battle, gs.player.id)) {
            unitOrders.add(newOrder);
        }
        parent.postMessage({
            eventName: 'new orders',
            ordersJson: unitOrders.toJson()
        }, '*');
    },
    updatePreviewOrders: function(mouse) {
        'use strict';
        var unitsToGiveOrders,
            self = this;
        this.previewOrders = {};
        if (!_.any(gs.ship.getPlayerUnits(gs.player.id),
                function(u) {
                    return sh.v.equal(u, mouse);//no ally at mouse pos
                })) {
            unitsToGiveOrders = _.filter(this.shipVM.selected(),
                function(u) {
                    //can't place order in same spot as another order
                    return !_.any(u.orderVMs, function(o) {
                        return sh.v.equal(o.getMarkerTile(), mouse);
                    }) &&
                        (u.orderVMs.length === 0 ||
                            _.last(u.orderVMs).selected());
                });
            _.each(unitsToGiveOrders, function(u) {
                var order = gs.ship.getValidOrderForPos(u.m, mouse);
                if (order) {
                    self.previewOrders[u.m.id] = utils.makeVM(order,
                        orderVMs.Move, orderVMs);
                    self.previewOrders[u.m.id].convertToPreview();
                }
            });
        }
    },
    getModelDifferenceUrl: function(aJsonString, bJsonString) {
        'use strict';
        var hashObject = {
                d: {
                    a: aJsonString,
                    b: bJsonString
                }
            };
        return 'http://tlrobinson.net/projects/javascript-fun/jsondiff/#' +
            encodeURIComponent(JSON.stringify(hashObject));
    },
    pause: function() {
        'use strict';
        this.shipVM.update();
        parent.postMessage({
            eventName: 'finished playing',
            battleJson: gs.battle.toJson(),
            ordersJson: gs.battle.extractOrders().toJson()
        }, '*');
        me.game.sort();
        me.game.repaint();

        _.each(me.game.getEntityByName('order'), function(oVM) {
            if (oVM.m.isValid(gs.ship, gs.player.id)) {
                oVM.updatePos();
            } else {
                oVM.remove();
            }
        });
        this.elapsed = 0;
        console.log('--- TURN ' + this.currentTurnID + ' ---');
        this.paused = true;
    },
    resume: function() {
        'use strict';
        //reset time
        this.turnBeginTime = me.timer.getTime();
        _.invoke(this.shipVM.unitVMs, 'deselect');
        this.paused = false;
    },
    deselectUnits: function() {
        'use strict';
        _.chain(gs.selected)
            .where({name: 'unit'})
            .invoke('deselect');
    },
    startDragBox: function(pos) {
        'use strict';
        this.dragBox = new ui.DragBox(pos);
    },
    releaseDragBox: function() {
        'use strict';
        var self = this;
        if (this.dragBox) {
            this.deselectUnits();
            _.each(this.shipVM.unitVMs, function(u) {
                var pos, unitRect;
                if (u.isMine()) {
                    pos = new me.Vector2d(
                        u.m.x * gs.TILE_SIZE,
                        u.m.y * gs.TILE_SIZE
                    );
                    unitRect = new me.Rect(pos, gs.TILE_SIZE, gs.TILE_SIZE);
                    if (self.dragBox.overlaps(unitRect)) {
                        u.select();
                    }
                }
            });
            this.dragBox = null;
        } else {
            console.warn('Tried to release dragBox but it was already' +
                ' released.');
        }
        utils.setCursor('default');
    },
    at: function(x, y) {
        'use strict';
        return gs.ship.at(x, y);
    }
});

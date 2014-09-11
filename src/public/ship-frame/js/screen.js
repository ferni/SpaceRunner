/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, gs, sh, ShipVM,
ScriptPlayer, $, utils, _, draw, ui, make, TILE_SIZE, HALF_TILE, ko*/

screens.register('battle', me.ScreenObject.extend({
    currentTurnID: null,
    scriptPlayer: null,
    scriptServer: [],
    mouseDownPos: null,
    /**
     *
     * @param battle sh.Battle
     * @param shipID int
     * @param orders Object
     */
    onResetEvent: function(battle, shipID, orders) {
        'use strict';
        this.parent({id: battle.id});
        this.turnDuration = battle.turnDuration;
        gs.battle = battle;
        gs.ship = _.findWhere(battle.ships, {id: shipID});
        console.log('Battle id is ' + this.id);
        this.shipVM = new ShipVM(gs.ship);
        this.shipVM.showInScreen();
        this.shipVM.update();
        this.scriptPlayer = new ScriptPlayer(this);
        me.input.bindKey(me.input.KEY.ESC, 'escape');
        me.input.bindKey(me.input.KEY.D, 'delete');
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
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.unbindKey(me.input.KEY.D);
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
    },
    onData: function(data) {
        'use strict';
        //TODO: receive the data (the script) through postMessage
        var screen = this;
        this.currentTurnID = data.currentTurnID;
        if (this.paused && data.scriptReady) {
            $.post('/battle/getscript', {id: screen.id}, function(data) {
                var script = new sh.Script().fromJson(data.script);
                screen.scriptServer = script;
                screen.scriptPlayer.loadScript(script);
                screen.shipVM.update();
                screen.resultingModel = data.resultingModel;
                screen.resume();
            });
        }
    },
    update: function() {
        'use strict';
        this.parent();
        if (!this.paused) {
            var elapsed = me.timer.getTime() - this.turnBeginTime;
            this.elapsed = elapsed;
            this.shipVM.update();
            this.scriptPlayer.update(elapsed);
            //update counter
            if (elapsed >= this.turnDuration) {
                this.pause();
            }
        } else {
            if (me.input.isKeyPressed('delete')) {
                _.chain(gs.selected)
                    .where({name: 'order'})
                    .each(function(orderVM) {
                        orderVM.deselect();
                        orderVM.remove();
                    });
            }
            if (me.input.isKeyPressed('escape')) {
                _.invoke(gs.selected, 'deselect');
                this.previewOrders = {};
            }
        }
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
            draggedOriginalPos,
            self = this;
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
                        this.dragging.unitVM.orders.valueHasMutated();
                    } else {
                        this.dragging.m.destination = draggedOriginalPos;
                    }
                    this.dragging.updatePos();
                }
                this.dragging = null;
            } else {
                _.each(this.previewOrders, function(orderVM, unitID) {
                    var unit = self.shipVM.getUnitVMByID(unitID);
                    unit.insertOrder(orderVM.m);
                });
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
                        (u.orders().length === 0 ||
                            _.last(u.orderVMs).selected());
                });
            _.each(unitsToGiveOrders, function(u) {
                var order = gs.ship.getValidOrderForPos(u.m, mouse);
                if (order) {
                    self.previewOrders[u.m.id] = make.vm(order);
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
    compareModelWithServer: function() {
        'use strict';
        var clientString = JSON.stringify(gs.battle.toJson()),
            serverString = JSON.stringify(this.resultingModel);
        if (clientString === serverString) {
            console.log('Client battle model correctly matches the server' +
                ' battle model.');
        } else {
            console.error('Client battle model is different than the server' +
                ' battle model (left: client, right: server): ' +
                this.getModelDifferenceUrl(clientString, serverString));
        }
    },
    pause: function() {
        'use strict';
        this.scriptPlayer.onPause();
        this.shipVM.update();
        if (this.resultingModel) {
            this.compareModelWithServer();
        }
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
    //When a player clicks "Ready"
    onReady: function() {
        'use strict';
        var screen = this;
        screen.readyButton.disable();
        //send the orders to the server
        $.post('/battle/ready',
            {id: this.id}, function(data) {
                if (data.wasReady) {
                    console.warn('According to the server, the player ' +
                        'was already ready.');
                }
                screen.startFetching();
            }, 'json')
            .fail(function() {
                console.error('Could not ready player: server error.');
                screen.readyButton.enable();
            });
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
                        u.m.x * TILE_SIZE,
                        u.m.y * TILE_SIZE
                    );
                    unitRect = new me.Rect(pos, TILE_SIZE, TILE_SIZE);
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
}));

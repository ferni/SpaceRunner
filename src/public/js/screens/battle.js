/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, ConnectedScreen, gs, sh, ShipVM, ScriptPrediction,
ScriptPlayer, $, utils, _, draw, ui, make, TILE_SIZE, HALF_TILE, ko*/

screens.register('battle', ConnectedScreen.extend({
    currentTurnID: null,
    scriptPlayer: null,
    scriptServer: [],
    mouseDownPos: null,
    onReset: function(battleModel) {
        'use strict';
        this.parent({id: battleModel.id});
        this.turnDuration = battleModel.turnDuration;
        gs.ship = new sh.Ship({json: battleModel.ship});
        this.stopFetching();
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

        if (battleModel.orders) {
            gs.ship.insertOrders(battleModel.orders);
        }
        //orders shown for each unit when moving the mouse around
        this.previewOrders = {};
        this.prevMouse = {x: 0, y: 0};
        if (this.htmlVM) {
            ko.applyBindings(this.htmlVM, document.getElementById('screensUi'));
        }
    },
    onDestroy: function() {
        'use strict';
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.unbindKey(me.input.KEY.D);
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this;
        this.readyButton = (function() {
            var btn = {},
                //reference to the dom node
                $node = $('#ready-button');
            btn.enabled = true;
            $node.click(function() {
                if (btn.enabled) {
                    screen.onReady();
                }
            });
            btn.enable = function() {
                btn.enabled = true;
                $node.removeClass('disabled')
                    .html('Ready');
            };
            btn.disable = function() {
                btn.enabled = false;
                $node.addClass('disabled')
                    .html('Awaiting players...');
            };
            return btn;
        }());

        //Knockout bindings
        function ViewModel() {
            this.shipVM = function() {
                return screen.shipVM;
            };
            this.selectedUnit = ko.observable(null);
        }
        this.htmlVM = new ViewModel();
        if (this.isReset) {
            ko.applyBindings(this.htmlVM, document.getElementById('screensUi'));
        }
        $('#time-line').jScrollPane();
    },
    onData: function(data) {
        'use strict';
        var screen = this;
        this.currentTurnID = data.currentTurnID;
        $('#turn-number').html(this.currentTurnID);
        if (this.paused && data.scriptReady) {
            //get the script
            $.post('/battle/getscript', {id: screen.id}, function(data) {
                var script = new sh.Script().fromJson(data.script);
                screen.scriptServer = script;
                screen.scriptPlayer.loadScript(script);
                screen.shipVM.update();
                screen.resultingShip = data.resultingShip;
                //screen.logActions(script);
                screen.resume();
                screen.stopFetching();
                $.post('/battle/scriptreceived', {id: screen.id}, function() {
                    //(informs the server that the script has been received)
                }).fail(function() {
                    console.error('Error pinging server.');
                });
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
            $('#elapsed').html(elapsed);
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
        //return true;
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        if (this.paused) {
            if (this.dragBox) {
                this.dragBox.draw(ctx);
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
                    if (this.dragging.m.isValid(gs.ship, gs.player.id)) {
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
    updateOrderVMsDuration: function() {
        'use strict';
        var self = this,
            resultingShip = gs.ship.clone(),
            script = sh.createScript(gs.ship.extractOrders(),
                resultingShip, this.turnDuration * 2);
        _.chain(script.byType('FinishOrder'))
            .groupBy('unitID')
            .each(function(finishActions, unitID) {
                var unitVM = self.shipVM.getUnitVMByID(unitID),
                    prevTime = 0,
                    lastIndex = 0;
                _.each(finishActions, function(action, index) {
                    unitVM.orderVMs[index].timeInfo({
                        start: prevTime,
                        end: action.time
                    });
                    prevTime = action.time;
                    lastIndex = index;
                });
                if (unitVM.orderVMs[lastIndex + 1]) {
                    unitVM.orderVMs[lastIndex + 1].timeInfo({
                        start: prevTime,
                        end: 8200//beyond next turn
                    });
                }
            });
    },
    getModelDifferenceUrl: function() {
        'use strict';
        var screen = this,
            hashObject = {
                d: {
                    a: JSON.stringify(gs.ship.toJson()),
                    b: JSON.stringify(screen.resultingShip)
                }
            };
        return 'http://tlrobinson.net/projects/javascript-fun/jsondiff/#' +
            encodeURIComponent(JSON.stringify(hashObject));
    },
    compareModelWithServer: function() {
        'use strict';
        if (gs.ship.hasSameJson(this.resultingShip)) {
            console.log('Client ship correctly matches the server ship.');
        } else {
            console.error('Client ship is different than the server ship' +
                ' (left: client, right: server): ' +
                this.getModelDifferenceUrl());
        }
    },
    pause: function() {
        'use strict';
        $('#paused-indicator, #ready-button').show();
        $('#elapsed').hide();
        this.readyButton.enable();
        this.scriptPlayer.onPause();
        this.shipVM.update();
        if (this.resultingShip) {
            this.compareModelWithServer();
        }
        this.updateOrderVMsDuration();
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
        $('#paused-indicator, #ready-button').hide();
        $('#elapsed').show();
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
    updateUnitHud: function() {
        'use strict';
        var selected = _.where(gs.selected, {name: 'unit'});
        if (selected.length === 1) {
            if (this.htmlVM.selectedUnit() !== selected[0]) {
                this.htmlVM.selectedUnit(selected[0]);
            }
        } else {
            this.htmlVM.selectedUnit(null);
        }
    },
    startDragBox: function(pos) {
        'use strict';
        this.dragBox = new ui.DragBox(pos);
        utils.setCursor('crooshair');
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

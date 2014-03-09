/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, screens, ConnectedScreen, gs, sh, ShipVM, ScriptPrediction,
ScriptPlayer, $, utils, _, draw, ui, make, TILE_SIZE, ko*/

screens.register('battle', ConnectedScreen.extend({
    currentTurnID: null,
    //scriptPrediction: null,
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
        $('#hp').html('[' + this.shipVM.hp + ']');
        //this.scriptPrediction = new ScriptPrediction(this);
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
            //update script prediction with new script model
            //this.scriptPrediction.predict();
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
            this.selectedUnit = ko.observable(null);
        }
        this.htmlVM = new ViewModel();
        ko.applyBindings(this.htmlVM, document.getElementById('screensUi'));
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
                        var unit = gs.ship.getUnitByID(orderVM.m.unitID),
                            unitVM = this.shipVM.getVM(unit);
                        orderVM.deselect();
                        unitVM.orders.remove(orderVM.m);
                    }, this);

            }
            if (me.input.isKeyPressed('escape')) {
                _.invoke(gs.selected, 'deselect');
            }
        }
        //return true;
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        if (this.paused) {
            //this.scriptPrediction.draw(ctx);
            if (this.dragBox) {
                this.dragBox.draw(ctx);
            }
        }

        //highlight highlighted tiles
        /*_.each(this.highlightedTiles, function(t){
            screen.drawTileHighlight(ctx, t.x, t.y, 'black', 2);
        });*/

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
            unitsToGiveOrders,
            enemies;
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.LEFT) {
            if (this.dragBox) {
                this.releaseDragBox();
            } else if (this.dragging) {//an order
                if (!sh.v.equal(this.dragging.m.destination, mouse)) {
                    this.dragging.m.destination = {x: mouse.x, y: mouse.y};
                    this.dragging.updatePos();
                    this.dragging.unitVM.orders.valueHasMutated();
                }
                this.dragging = null;
            } else if (!_.any(gs.ship.getPlayerUnits(gs.player.id),
                    function(u) {
                        return sh.v.equal(u, mouse);//no ally at mouse pos
                    })) {
                unitsToGiveOrders = _.filter(this.shipVM.selected(),
                    function(u) {
                        //can't place order in same spot as another order
                        return !_.any(u.orderVMs, function(o) {
                            return sh.v.equal(o.getMarkerTile(), mouse);
                        });
                    });
                if (unitsToGiveOrders.length > 0) {
                    enemies = _.filter(gs.ship.unitsMap.at(mouse.x, mouse.y),
                        utils.isEnemy);
                    if (enemies.length > 0) {
                        this.giveSeekAndDestroyOrder(unitsToGiveOrders,
                            enemies[0]);
                    } else {
                        this.giveMoveOrder(unitsToGiveOrders, mouse);
                    }
                }
            }
            this.mouseDownPos = null;
        }
    },
    mouseMove: function() {
        'use strict';
        var mouse = utils.getMouse(),
            mousePx = utils.lastMousePx;
        if (this.dragging) {
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
        }
    },
    giveMoveOrder: function(unitVMs, destination) {
        'use strict';
        _.each(unitVMs, function(u) {
            var order = new sh.orders.Move({
                    unitID: u.m.id,
                    destination: destination
                });
            if (order.isValid(gs.ship, gs.player.id)) {
                u.insertOrder(order);
            }
        });
    },
    giveSeekAndDestroyOrder: function(unitVMs, target) {
        'use strict';
        _.each(unitVMs, function(u) {
            var order = new sh.orders.SeekAndDestroy({
                unitID: u.m.id,
                targetID: target.id
            });
            if (order.isValid(gs.ship, gs.player.id)) {
                u.insertOrder(order);
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
            console.warn('Client ship is different than the server ship' +
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
        //this.scriptPrediction.clear();
        //this.scriptPrediction.predict();
        me.game.sort();
        me.game.repaint();
        //empty the script
        this.scriptServer = [];

        _.invoke(me.game.getEntityByName('order'), 'updatePos');

        this.paused = true;
    },
    resume: function() {
        'use strict';
        $('#paused-indicator, #ready-button').hide();
        $('#elapsed').show();
        //reset time
        this.turnBeginTime = me.timer.getTime();
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
    deselectOrders: function() {
        'use strict';
        _.chain(gs.selected)
            .where({name: 'order'})
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

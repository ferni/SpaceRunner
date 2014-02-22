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
    scriptPrediction: null,
    scriptPlayer: null,
    scriptServer: [],
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
        this.scriptPrediction = new ScriptPrediction(this);
        this.scriptPlayer = new ScriptPlayer(this);
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
            this.scriptPrediction.predict();
        }
    },
    onDestroy: function() {
        'use strict';
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
    logActions: function(script) {
        'use strict';
        _.each(script.byUnit, function(actions, unitID) {
            console.log('Unit ' + unitID + '\'s actions:');
            _.each(actions, function(a) {
                console.log(utils.actionStr(a));
            });
        });
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
        }
        //return true;
    },
    draw: function(ctx) {
        'use strict';
        var mouse = utils.getMouse();
        this.parent(ctx);
        if (this.paused) {
            this.scriptPrediction.draw(ctx);
            if (gs.ship.hasUnits(mouse)) {
                utils.setCursor('pointer');
                if (_.any(gs.ship.unitsMap.at(mouse.x, mouse.y),
                        utils.isMine)) {
                    draw.tileHighlight(ctx, mouse, 'teal', 1);
                } else {
                    draw.tileHighlight(ctx, mouse, 'red', 1);
                }
            } else if (!this.dragBox) {
                utils.setCursor('default');
            }

            //highlight where the mouse is pointing if it's a unit

            if (_.any(this.shipVM.selected(), function(u) {
                    return u.isMine();
                })) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                draw.circle(ctx, mouse, 5, 'green');
                ctx.restore();
            }
            if (this.dragBox) {
                this.dragBox.draw(ctx);
                utils.setCursor('crosshair');
            }
        } else {
            utils.setCursor('default');
        }

        //highlight highlighted tiles
        /*_.each(this.highlightedTiles, function(t){
            screen.drawTileHighlight(ctx, t.x, t.y, 'black', 2);
        });*/

    },
    mouseUp: function(e) {
        'use strict';
        var mouse = utils.getMouse(),
            which = e.which - 1; //workaround for melonJS mismatch
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.LEFT) {
            this.selectUnit(mouse.x, mouse.y);
            this.releaseDragBox();
        }
    },
    mouseDown: function(e) {
        'use strict';
        var mouse = utils.getMouse(),
            which = e.which - 1; //workaround for melonJS mismatch
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.RIGHT) {
            this.giveMoveOrder(this.shipVM.selected(), mouse);
        } else if (which === me.input.mouse.LEFT) {
            this.startDragBox(utils.getMouse(true));
        }

    },
    mouseMove: function() {
        'use strict';
        if (this.dragBox) {
            this.dragBox.updateFromMouse(utils.getMouse(true));
        }
    },
    giveMoveOrder: function(unitVMs, destination) {
        'use strict';
        var self = this,
            newOrders = {};
        _.each(unitVMs, function(u) {
            var order = new sh.orders.Move({
                    unitID: u.m.id,
                    destination: destination
                });
            if (sh.verifyOrder(order, gs.ship, gs.player.id)) {
                u.orders([order]);
                newOrders[u.m.id] = [order];
            }
        });
        if (_.size(newOrders) > 0) {
            //update script prediction after new orders given
            self.scriptPrediction.predict();
            //send order to server
            $.post('/battle/sendorders',
                {id: this.id, orders: new sh.OrderPackage(newOrders).toJson()},
                function() {
                    console.log('Orders successfully submitted');
                }, 'json')
                .fail(function() {
                    console.error('Server error when submitting orders.');
                });
        }
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
        this.scriptPrediction.clear();
        this.scriptPrediction.predict();
        me.game.sort();
        me.game.repaint();
        //empty the script
        this.scriptServer = [];

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
    selectUnit: function(x, y) {
        'use strict';
        var self = this,
            units = gs.ship.unitsMap.at(x, y);
        this.unselectAll();
        if (units) {
            this.shipVM.updateUnits();
            _.each(units, function(unit) {
                var selectedVM = self.shipVM.getVM(unit);
                selectedVM.selected = true;
                console.log('Selected unit ' + unit.id + ' ' +
                    sh.v.str(unit));
                self.htmlVM.selectedUnit(selectedVM);
            });
            return true;
        }
        self.htmlVM.selectedUnit(null);
        return false;
    },
    unselectAll: function() {
        'use strict';
        _.each(this.shipVM.unitVMs, function(u) {
            u.selected = false;
        });
    },
    startDragBox: function(pos) {
        'use strict';
        this.dragBox = new ui.DragBox(pos);
    },
    releaseDragBox: function() {
        'use strict';
        var self = this;
        if (this.dragBox) {
            _.each(this.shipVM.unitVMs, function(u) {
                var pos, unitRect;
                if (u.isMine()) {
                    pos = new me.Vector2d(
                        u.m.x * TILE_SIZE,
                        u.m.y * TILE_SIZE
                    );
                    unitRect = new me.Rect(pos, TILE_SIZE, TILE_SIZE);
                    if (self.dragBox.overlaps(unitRect)) {
                        u.selected = true;
                    }
                }
            });
            this.dragBox = null;
        } else {
            console.warn('Tried to release dragBox but it was already' +
                ' released.');
        }

    },
    at: function(x, y) {
        'use strict';
        return gs.ship.at(x, y);
    }
}));

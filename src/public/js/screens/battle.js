/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global screens-html, GameScreen*/

screens.register('battle', ConnectedScreen.extend({
    TURN_DURATION: 3000,
    verifiedOrders: {},
    currentTurnID: null,
    scriptPrediction: null,
    scriptPlayer: null,
    scriptServer: [],
    onReset: function(battleModel){
        this.parent({id: battleModel.id});
        gs.ship =  new sh.Ship({jsonString: battleModel.ship});
        this.stopFetching();
        console.log('Battle id is ' + this.id);
        this.shipVM = new ShipVM(gs.ship);
        this.shipVM.showInScreen();
        this.shipVM.update();
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
            this.verifiedOrders = battleModel.orders;
            //update script prediction with new script model
            this.scriptPrediction.m = sh.createScript(this.verifiedOrders,
                gs.ship, this.TURN_DURATION);
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
        this.readyButton = (function(){
            var btn = {},
                //reference to the dom node
                $node = $('#ready-button');
            btn.enabled = true;
            $node.click(function() {
                if(btn.enabled) {
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
        })();
    },
    onData: function(data){
        var screen = this;
        this.currentTurnID = data.currentTurnID;
        $('#turn-number').html(this.currentTurnID);
        if (this.paused && data.scriptReady) {
            //get the script
            $.post('/battle/getscript', {id: screen.id}, function (data) {
                var script = new sh.Script().fromJson(data.script);
                screen.scriptServer = script;
                screen.scriptPlayer.loadScript(script);
                screen.shipVM.update();
                //screen.logActions(script);
                screen.resume();
                screen.stopFetching();
                $.post('/battle/scriptreceived', {id: screen.id},function () {
                    //(informs the server that the script has been received)
                }).fail(function () {
                        console.error('Error pinging server.');
                    });
            });
        }
    },
    logActions: function(script) {
        _.each(script.byUnit, function(actions, unitID){
            console.log('Unit ' + unitID + '\'s actions:');
            _.each(actions, function(a){
                console.log(utils.actionStr(a));
            })
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
            if (elapsed >= this.TURN_DURATION) {
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
            if (gs.ship.at(mouse.x, mouse.y) instanceof sh.Unit) {
                utils.setCursor('pointer');
            } else if(!this.dragBox){
                utils.setCursor('default')
            }

            //highlight where the mouse is pointing if it's a unit
            if (gs.ship.hasUnits(mouse) ||
                this.shipVM.selected().length > 0) {
                draw.tileHighlight(ctx, mouse.x, mouse.y, 'teal', 1);
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
        } else if (which === me.input.mouse.LEFT){
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
        var self = this,
            newOrders = {};
        _.each(unitVMs, function(u){
            var order = make.moveOrder(u.m, destination);
            if(sh.verifyOrder(order, gs.ship, gs.player.id)) {
                self.verifiedOrders[u.m.id] = order;
                newOrders[u.m.id] = order;
            }
        });
        //update script prediction with new script model
        self.scriptPrediction.m = sh.createScript(self.verifiedOrders,
            gs.ship, self.TURN_DURATION);
        //send order to server
        $.post('/battle/sendorders',
            {id: this.id, orders: newOrders}, function() {
                console.log('Orders successfully submitted');
        }, 'json')
        .fail(function(){
            console.error('Server error when submitting orders.');
        });

    },
    updateUnitsImageOffset: function(){
        var i, j, unitVMs = this.shipVM.unitVMs, unitA, unitB;
        //TODO: enable map to have multiple units in same position
        _.each(unitVMs, function(u){
            u.putInCenter();
        });
        for (i = unitVMs.length - 1; i >= 0; i--) {
            unitA = unitVMs[i];
            for (j = i - 1; j >= 0; j--) {
                unitB = unitVMs[j];
                if(unitA.m.x === unitB.m.x && unitA.m.y === unitB.m.y &&
                    unitA.m.owner.id !== unitB.m.owner.id) {
                    if(unitA.isMine()){
                        unitA.putInTopRight();
                        unitB.putInBottomLeft();
                    }else{
                        unitA.putInBottomLeft();
                        unitB.putInTopRight();
                    }
                }
            }
        }
    },
    
    pause: function() {
        'use strict';
        $('#paused-indicator, #ready-button').show();
        $('#elapsed').hide();
        this.readyButton.enable();
        sh.updateShipByScript(gs.ship, this.scriptServer);
        this.updateUnitsImageOffset();
        this.shipVM.update();
        me.game.sort();
        me.game.repaint();
        //empty the script
        this.scriptServer = [];
        this.scriptPrediction.m = [];

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
    onReady: function(){
        var screen = this;
        screen.readyButton.disable();
        //send the orders to the server
        $.post('/battle/ready',
            {id: this.id}, function(data) {
                if(data.wasReady) {
                    console.warn('According to the server, the player ' +
                        'was already ready.');
                }
                screen.verifiedOrders = {};
                screen.startFetching();
            }, 'json')
            .fail(function(){
                console.error('Could not ready player: server error.');
                screen.readyButton.enable();
            });
    },
    selectUnit: function(x, y) {
        'use strict';
        var unit = gs.ship.at(x, y);
        this.unselectAll();
        if (unit instanceof sh.Unit) {
            this.shipVM.updateUnits();
            this.shipVM.getVM(unit).selected = true;
            console.log('Selected unit ' + unit.id + ' ' +
                utils.posStr(unit));
            return true;
        }
        return false;
    },
    unselectAll: function() {
        'use strict';
        _.each(this.shipVM.unitVMs, function(u) {
            return u.selected = false;
        });
    },
    startDragBox: function(pos) {
        this.dragBox = new DragBox(pos);
    },
    releaseDragBox: function() {
        var self = this;
        if (this.dragBox) {
            _.each(this.shipVM.unitVMs, function(u){
                var unitRect = new me.Rect(u.pos, TILE_SIZE, TILE_SIZE);
                if(self.dragBox.overlaps(unitRect)) {
                    u.selected = true;
                }
            });
            this.dragBox = null;
        } else {
            console.warn('Tried to release dragBox but it was already' +
                ' released.');
        }

    },
    at: function(x, y) {
        return gs.ship.at(x, y);
    }


}));
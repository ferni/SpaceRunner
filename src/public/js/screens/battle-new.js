/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global screens-html, GameScreen*/

screens.register('battle', ConnectedScreen.extend({
    TURN_DURATION_SEC: 3,
    TURN_DURATION: 3000,
    verifiedOrders: [],
    currentTurnID: null,
    onReset: function(settings){
        this.parent(settings);
        console.log('id is ' + this.id);
        this.shipVM = new ShipVM(gs.ship);
        this.shipVM.showInScreen();
        this.shipVM.update();

        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport,
            this.mouseMove.bind(this));

        this.pause();
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
                //TODO: use the script (make script vm)

                sh.updateShipByScript(gs.ship, data.script,
                    screen.TURN_DURATION);
                screen.shipVM.update();
                screen.resume();
                $.post('/battle/scriptreceived', {id: screen.id},function () {
                    //(informs the server that the script has been received)
                }).fail(function () {
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
        var mouse = utils.getMouse(),
            screen = this;
        this.parent(ctx);
        if (this.paused) {
            if (gs.ship.at(mouse.x, mouse.y) instanceof sh.Unit) {
                utils.setCursor('pointer');
            } else if(!this.dragBox){
                utils.setCursor('default')
            }

            //highlight where the mouse is pointing if it's a unit
            if (gs.ship.isAt(mouse.x, mouse.y, 'unit') ||
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
    mouseMove: function(e) {
        'use strict';
        if (this.dragBox) {
            this.dragBox.updateFromMouse(utils.getMouse(true));
        }
    },
    giveMoveOrder: function(unitVMs, destination) {
        var self = this;
        _.each(unitVMs, function(u){
            var order = make.moveOrder(u.m, destination);
            if(sh.verifyOrder(order, gs.ship, gs.player.id)) {
                self.verifiedOrders.push(order);
                console.log('Order given valid.');
            }else{
                console.log('Order given INVALID.');
            }
        });

    },
    selectUnit: function(x, y) {
        'use strict';
        var unit = gs.ship.at(x, y);
        this.unselectAll();
        if (unit instanceof sh.Unit) {
            this.shipVM.updateUnits();
            this.shipVM.getVM(unit).selected = true;
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
    pause: function() {
        'use strict';
        $('#paused-indicator, #ready-button').show();
        $('#elapsed').hide();
        this.readyButton.enable();
        //TODO: empty the script

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
        $.post('/battle/submitorders',
            {id: this.id, orders: this.verifiedOrders}, function(data) {
                console.log('Orders successfully submitted');
            }, 'json')
            .fail(function(){
                console.error('Server error when submitting orders.');
                screen.readyButton.enable();
            });
    },
    at: function(x, y) {
        return gs.ship.at(x, y);
    }


}));
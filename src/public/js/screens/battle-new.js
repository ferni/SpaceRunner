/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global screens, GameScreen*/

screens.register('battle', GameScreen.extend({
    TURN_DURATION_SEC: 3,
    TURN_DURATION: 3000,
    verifiedOrders: [],
    onReset: function(settings){
        this.id = settings.battleID;
        this.shipVM = new ShipVM(gs.ship);
        this.shipVM.showInScreen();
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
        $('#resume-button').click(function() {
            screen.resume();
        });

    },
    update: function() {
        'use strict';
        this.parent();
        if(this.shipVM.update()){
            me.game.sort();
        }
        if (!this.paused) {
            var elapsed = me.timer.getTime() - this.turnBeginTime;
            //update counter
            $('#elapsed').html(elapsed);
            if (elapsed >= this.TURN_DURATION) {
                this.pause();
            }
        }
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
        $('#paused-indicator, #resume-button').show();
        this.paused = true;
    },
    resume: function() {
        'use strict';
        $('#paused-indicator, #resume-button').hide();
        //send the orders to the server and pause on callback

        //reset time
        this.turnBeginTime = me.timer.getTime();
        this.paused = false;


    },
    at: function(x, y) {
        return gs.ship.at(x, y);
    }


}));
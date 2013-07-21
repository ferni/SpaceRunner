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
        if (!this.paused) {
            var elapsed = me.timer.getTime() - this.turnBeginTime;
            //update counter
            $('#elapsed').html(elapsed);
            if (elapsed >= this.TURN_DURATION) {
                this.pause();
            }
        }
    },
    mouseUp: function(e) {
        'use strict';
        var mouse = utils.getMouse(),
            which = e.which - 1; //workaround for melonJS mismatch
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.LEFT) {
            //this.selectUnit(mouse.x, mouse.y);
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
            //this.giveMoveOrder(this.shipVM.selected(), mouse);
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
        //reset time
        this.turnBeginTime = me.timer.getTime();
        this.paused = false;
    }


}));
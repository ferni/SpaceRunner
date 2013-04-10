/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, jsApp, ko, _ */

var BattleScreen = me.ScreenObject.extend({
    TURN_DURATION: 3000,//in milliseconds
    name: 'battle-screen',
    isReset: false,
    paused: true,
    turnBeginTime: null,
    selected: [],//selected units
    Order: function(){
       this.unit;
    },
    init: function() {
        'use strict';
        this.parent(true);
    },
    onResetEvent: function() {
        'use strict';
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'black');
        html.load('battle-screen');
        this.onHtmlLoaded();

        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));

        me.game.ship.showInScreen();

        this.putUnits();
        this.pause();
        this.isReset = true;
        jsApp.onScreenReset();
    },
    onDestroyEvent: function() {
        'use strict';
        this.isReset = false;
        html.clear();
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this;
        $('#resume-button').click(function(){
            screen.resume();
        });
    },
    update: function(){
        if(!this.paused){
            var elapsed = this.getElapsedTime();
            //update counter
            $('#elapsed').html(elapsed);
            if(elapsed >= this.TURN_DURATION){
                this.pause();
            }
        }
    },
    draw: function(ctx){
        this.parent(ctx);
        ctx.beginPath();
        ctx.strokeStyle = 'limegreen';
        ctx.lineWidth = 2;
        _.each(this.selected, function(u){
            //draw rectangle around each selected unit
            ctx.moveTo(u.pos.x, u.pos.y);
            ctx.strokeRect(u.pos.x, u.pos.y, TILE_SIZE, TILE_SIZE);
        });
    },
    mouseUp: function(e){
        var mouse = utils.getMouse(),
            which = e.which - 1; //workaround for melonJS mismatch
        if(!this.paused){
            return;
        }
        if(which == me.input.mouse.LEFT){
            this.selectUnit(mouse.x, mouse.y);
        }else if(which == me.input.mouse.RIGHT){
            if(this.selected[0]) {//there is a selected unit

            }
        }
    },
    putUnits: function(){
        'use strict';
        //find empty spot
        var empty = null, ship = me.game.ship, unit;
        utils.matrixTiles(ship.width, ship.height,
            function(x, y){
                if(empty){
                    return;
                }
                if(ship.mapAt(x, y) == charMap.codes._cleared){
                    empty = {x: x, y: y};
                }
            });
        unit = new Unit(empty.x, empty.y);
        ship.addUnit(unit);
    },
    selectUnit: function(x, y){
        var ship = me.game.ship,
            unit = _.find(ship.units(), function(u){
                return u.x() == x && u.y() == y;
            });
        this.unselectAll();
        if(!unit){
            return false;
        }
        this.selected.push(unit);
    },
    unselectAll: function(){
        this.selected = [];
    },
    pause: function(){
        'use strict';
        $('#paused-indicator, #resume-button').show();
        _.each(me.game.ship.units(), function(u){
            u.freeze();
        });
        this.paused = true;
    },
    resume: function(){
        'use strict';
        $('#paused-indicator, #resume-button').hide();
        //reset time
        this.turnBeginTime = me.timer.getTime();
        _.each(me.game.ship.units(), function(u){
            u.unfreeze();
        });
        this.paused = false;
    },
    getElapsedTime: function(){
        if(this.paused){
            throw 'Should only call getElapsedTime when resumed.';
        }
        return me.timer.getTime() - this.turnBeginTime;
    }
});


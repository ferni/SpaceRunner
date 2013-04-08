/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, jsApp, ko, _ */

var BattleScreen = me.ScreenObject.extend({
    TURN_DURATION: 5000,//in milliseconds
    name: 'battle-screen',
    isReset: false,
    paused: true,
    turnBeginTime: null,
    init: function() {
        'use strict';
        this.parent(true);
    },

    update: function(){
        if(!this.paused){
            var elapsed = this.getElapsedTime();
            $('#elapsed').html(elapsed);
            if(elapsed >= this.TURN_DURATION){
                this.pause();
            }
        }
    },
    onResetEvent: function() {
        'use strict';
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'black');
        html.load('battle-screen');
        this.onHtmlLoaded();

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
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this;
        $('#resume-button').click(function(){
            screen.resume();
        });
    },
    putUnits: function(){
        'use strict';
        //find empty spot
        var empty = null;
        utils.matrixTiles(me.game.ship.width, me.game.ship.height,
            function(x, y){
                if(empty){
                    return;
                }
                if(me.game.ship.mapAt(x, y) == charMap.codes._cleared){
                    empty = {x: x, y: y};
                }
            });
        var unit = new Unit(empty.x, empty.y);
        me.game.add(unit, unit.zIndex);
    },
    pause: function(){
        'use strict';
        $('#paused-indicator, #resume-button').show();
        this.paused = true;
    },
    resume: function(){
        'use strict';
        $('#paused-indicator, #resume-button').hide();
        //reset time
        this.turnBeginTime = me.timer.getTime();
        this.paused = false;
    },
    getElapsedTime: function(){
        if(this.paused){
            throw 'Should only call getElapsedTime when resumed.';
        }
        return me.timer.getTime() - this.turnBeginTime;
    }
});


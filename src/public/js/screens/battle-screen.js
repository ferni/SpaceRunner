/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, jsApp, ko, _, PF, $, utils, TILE_SIZE, HALF_TILE,
charMap, Unit*/

var BattleScreen = me.ScreenObject.extend({
    TURN_DURATION_SEC: 3,
    TURN_DURATION: 3000,
    name: 'battle-screen',
    isReset: false,
    paused: true,
    turnBeginTime: null,
    settings:{},
    highlightedTiles: [],
    scripter: null,
    init: function() {
        'use strict';
        this.parent(true);
    },
    onResetEvent: function(settings) {
        'use strict';
        this.parent();

        if(settings && settings.tmxName){
            me.game.ship = new Ship({tmxName: settings.tmxName}, true);
        }
        this.settings = this.completeSettings(settings);
        me.video.clearSurface(me.video.getScreenContext(), 'black');
        //reset ship
        //TODO: make ship.toJsonString work with units
        /*
        me.game.ship = new Ship({
            jsonString: me.game.ship.toJsonString()
        }, true);*/
        this.TURN_DURATION_SEC = this.settings.turnDuration;
        this.TURN_DURATION = this.settings.turnDuration * 1000;

        this.configureUnits();
        html.load('battle-screen');
        this.onHtmlLoaded();
        this.scripter = this.getScripter();
        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.game.ship.showInScreen();

        this.pause();

        this.isReset = true;
        jsApp.onScreenReset();
    },
    onDestroyEvent: function() {
        'use strict';
        this.isReset = false;
        html.clear();
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this,
            DebugSettingsPanelVM;
        $('#resume-button').click(function() {
            screen.resume();
        });

        DebugSettingsPanelVM = function(){
            this.settings = ko.mapping.fromJS(screen.settings);
            this.apply = function(){
                //reload screen
                if (screen.paused) {
                    me.state.change(me.state.BATTLE, ko.toJS(this.settings));
                } else{
                    alert('Can apply only when paused.');
                }
            };
            this.toggle = function(){
                this.settings.showSettings(!this.settings.showSettings());
            };
        };
        ko.applyBindings(new DebugSettingsPanelVM(),
            document.getElementById('debug-settings'));
    },
    update: function() {
        'use strict';
        if (!this.paused) {
            var elapsed = this.getElapsedTime();
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
            _.each(me.game.ship.units(), function(u) {
                u.drawPath(ctx);
                if (u.selected) {
                    //draw rectangle around each selected unit
                    screen.drawTileHighlight(ctx, u.x(), u.y(),
                        'limegreen', 2);
                }
            });
        }

        //highlight where the mouse is pointing
        if (me.game.ship.isInside(mouse.x, mouse.y)) {
            this.drawTileHighlight(ctx, mouse.x, mouse.y, 'teal', 1);
        }

        //highlight highlighted tiles
        _.each(this.highlightedTiles, function(t){
            screen.drawTileHighlight(ctx, t.x, t.y, 'black', 2);
        });
    },
    drawTileHighlight: function(ctx, x, y, color, thickness) {
        'use strict';
        var pixelPos = {x: x * TILE_SIZE,
            y: y * TILE_SIZE};
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.moveTo(pixelPos.x, pixelPos.y);
        ctx.strokeRect(pixelPos.x, pixelPos.y, TILE_SIZE, TILE_SIZE);
    },
    completeSettings: function(settings) {
        //set default settings
        var units = me.game.ship.units(),
            i;
        if (!settings) {
            settings = {};
        }
        if (!settings.collisionResolution) {
            settings.collisionResolution = collisionResolutions.waitForClearing;
        }
        if (!settings.showSettings) {
            settings.showSettings = true;
        }
        if (!settings.unitSpeeds) {
            settings.unitSpeeds = [];
            for(i = 0; i < units.length; i++){
                settings.unitSpeeds[i] = {speed: units[i].speed};
            }
        }
        if (!settings.turnDuration) {
            settings.turnDuration = 4;
        }
        return settings;
    },
    configureUnits: function() {
        'use strict';
        var units = me.game.ship.units(),
            i;
        for(i = 0; i < units.length; i++) {
            //temporary workaround to reset units
            //until ship.toJsonString works with units
            units[i].path = [];
            units[i].script = [];
            units[i].speed = this.settings.unitSpeeds[i].speed;
            units[i].turnDuration = this.TURN_DURATION;
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
            this.selectUnit(mouse.x, mouse.y);
        }
    },
    mouseDown: function(e) {
        'use strict';
        var mouse = utils.getMouse(),
            which = e.which - 1, //workaround for melonJS mismatch
            ship = me.game.ship;
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.RIGHT) {
            if (ship.selected().length > 0) {//there is a selected unit
                this.generateScripts(ship.selected()[0], mouse);
            }
        }
    },
    highlightTile: function(x, y){
        this.highlightedTiles.push({x: x, y: y});
    },
    generateScripts: function(unit, destination){
        'use strict';
        this.scripter.generateScripts(unit, destination);
    },
    getScripter: function(){
        switch(this.settings.collisionResolution){
            case collisionResolutions.endOfTurn:
                return new EndOfTurnScripter(this.TURN_DURATION);
            case collisionResolutions.avoidOtherPaths:
                return new AvoidOtherPathsScripter(this.TURN_DURATION);
            case collisionResolutions.waitForClearing:
                return new WaitForClearingScripter(this.TURN_DURATION);
            default : //collisionResolutions.none
                return new DefaultScripter(this.TURN_DURATION);
        }
    },
    selectUnit: function(x, y) {
        'use strict';
        var ship = me.game.ship,
            unit = _.find(ship.units(), function(u) {
                return u.x() === x && u.y() === y;
            });
        this.unselectAll();
        if (!unit) {
            return false;
        }
        unit.selected = true;
        return true;
    },
    unselectAll: function() {
        'use strict';
        _.each(me.game.ship.units(), function(u) {
            return u.selected = false;
        });
    },
    pause: function() {
        'use strict';
        $('#paused-indicator, #resume-button').show();
        _.each(me.game.ship.units(), function(u) {
            u.pause();
        });
        this.generateScripts();
        this.paused = true;
    },
    resume: function() {
        'use strict';
        $('#paused-indicator, #resume-button').hide();
        //reset time
        this.turnBeginTime = me.timer.getTime();
        _.each(me.game.ship.units(), function(u) {
            u.resume();
        });
        this.paused = false;
    },
    getElapsedTime: function() {
        'use strict';
        if (this.paused) {
            throw 'Should only call getElapsedTime when resumed.';
        }
        return me.timer.getTime() - this.turnBeginTime;
    }
});


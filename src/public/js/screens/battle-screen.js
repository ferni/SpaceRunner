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
    pfFinder: new PF.AStarFinder({
        allowDiagonal: false
    }),
    settings:{},
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
            mousePx;
        this.parent(ctx);
        if (this.paused) {
            _.each(me.game.ship.units(), function(u) {
                u.drawPath(ctx);
                if (u.selected) {
                    //draw rectangle around each selected unit
                    ctx.beginPath();
                    ctx.strokeStyle = 'limegreen';
                    ctx.lineWidth = 2;
                    ctx.moveTo(u.pos.x, u.pos.y);
                    ctx.strokeRect(u.pos.x, u.pos.y, TILE_SIZE, TILE_SIZE);
                }
            });
        }

        //highlight where the mouse is pointing
        if (me.game.ship.isInside(mouse.x, mouse.y)) {
            mousePx = {x: mouse.x * TILE_SIZE,
                y: mouse.y * TILE_SIZE};
            ctx.strokeStyle = 'teal';
            ctx.lineWidth = 1;
            ctx.moveTo(mousePx.x, mousePx.y);
            ctx.strokeRect(mousePx.x, mousePx.y, TILE_SIZE, TILE_SIZE);
        }
    },
    completeSettings: function(settings) {
        //set default settings
        var units = me.game.ship.units(),
            i;
        if (!settings) {
            settings = {};
        }
        if (!settings.collisionResolution) {
            settings.collisionResolution = collisionResolutions.endOfTurn;
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

            if(this.posConflictsWithOtherEndPos(null, mouse)){
                console.log('-- UNIT END POSITION SELECTED --');
            }
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
    generateScripts: function(unit, destination){
        'use strict';
        switch(this.settings.collisionResolution){
            case collisionResolutions.none:
                return this.generateScripts_noResolution(unit, destination);
            case collisionResolutions.endOfTurn:
                return this.generateScripts_eotResolution(unit, destination);
            case collisionResolutions.avoidOtherPaths:
                return this.generateScripts_avoidOtherPaths(
                    unit, destination);
        }
    },
    generateScripts_noResolution: function(unit, mouse){
        'use strict';
        var ship = me.game.ship,
            units = ship.units(),
            screen = this,
            grid, path;
        if (unit && mouse) {
            if (mouse.x === unit.x() && mouse.y === unit.y()) {
                unit.path = [];
            } else {
                //TODO: cache pf matrix on ship
                grid = new PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
                path = this.pfFinder.findPath(unit.x(), unit.y(),
                    mouse.x, mouse.y, grid);
                console.log('path length: ' + (path.length - 1));
                if(path.length > 1) {
                    unit.path = path;
                }
            }
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });
    },
    /**
     * Generates scripts for the units resolving
     * any end-position conflicts.
     */
    generateScripts_eotResolution: function(unit, mouse){
        'use strict';
        var ship = me.game.ship,
            units = ship.units(),
            screen = this,
            someScriptChanged,
            grid, path;
        if (unit && mouse) {
            if (mouse.x === unit.x() && mouse.y === unit.y()) {
                unit.path = [];
            } else {
                //TODO: cache pf matrix on ship
                grid = new PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
                path = this.pfFinder.findPath(unit.x(), unit.y(),
                    mouse.x, mouse.y, grid);
                console.log('path length: ' + (path.length - 1));
                if(path.length > 1) {
                    unit.path = path;
                }
            }
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });
        //solve end positions conflicts
        do {
            someScriptChanged = false;
            _.each(units, function(u){
                while (screen.posConflictsWithOtherEndPos(u, u.eotPos())) {
                    if (u.script.length === 0) {
                        console.warn('The end position conflict should be' +
                            ' resolved but persists after removing all the' +
                            ' unit script');
                        break;
                    }
                    u.script.pop();
                    someScriptChanged = true;
                }
            });
        } while(someScriptChanged)
    },
    posConflictsWithOtherEndPos: function(unit, pos) {
        var ship = me.game.ship;
        return _.any(ship.units(), function(u){
            var unitEndPos;
            if (unit === u) {
                return false;
            }
            unitEndPos = u.eotPos();
            return unitEndPos.x === pos.x && unitEndPos.y === pos.y;
        });
    },
    generateScripts_avoidOtherPaths: function(unit, mouse) {
        var ship = me.game.ship,
            units = ship.units(),
            screen = this,
            grid, path, i;
        if (unit && mouse) {
            if (mouse.x === unit.x() && mouse.y === unit.y()) {
                unit.path = [];
            } else {
                //TODO: cache pf matrix on ship
                grid = new PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
                _.each(units, function(u){
                    if(u !== unit){
                        if (u.willMove()) {
                            for(i = 1; i < u.path.length; i++){
                                //set the units' paths as not walkable
                                grid.setWalkableAt(u.path[i][0], u.path[i][1],
                                    false);
                            }
                        } else {
                            //if the unit would not move, it blocks
                            grid.setWalkableAt(u.x(), u.y(), false);
                        }
                    }
                });
                path = this.pfFinder.findPath(unit.x(), unit.y(),
                    mouse.x, mouse.y, grid);
                console.log('path length: ' + (path.length - 1));
                if(path.length > 1) {
                    unit.path = path;
                }
            }
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });
    },
    generateScripts_waitForClearing: function(unit, mouse){

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

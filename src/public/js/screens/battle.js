/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, jsApp, ko, _, PF, $, utils, TILE_SIZE, HALF_TILE,
hullMap, Unit*/

screens.register('battle', GameScreen.extend({
    BattleID: null,
    TURN_DURATION_SEC: 3,
    TURN_DURATION: 3000,
    paused: true,
    turnBeginTime: null,
    settings:{},
    highlightedTiles: [],
    scripter: null,
    dragBox: null,
    orders: [],
    init: function(name) {
        'use strict';
        this.parent(name);
    },
    onReset: function(settings) {
        'use strict';
        if(!settings && !settings.battleID) {
            throw new Error('The battleID is mandatory for the battle-screen');
        }
        this.battleID = settings.battleID;

        if(settings.tmxName){
            gameState.ship = new Ship({tmxName: settings.tmxName}, true);
        }
        //reset ship
        if(settings.shipJsonString) {
            gameState.ship = new Ship({jsonString: settings.shipJsonString},
                true);
        }
        /*
         gameState.ship = new Ship({
         jsonString: gameState.ship.toJsonString()
         }, true);*/
        this.settings = this.completeSettings(settings);
        this.TURN_DURATION_SEC = this.settings.turnDuration;
        this.TURN_DURATION = this.settings.turnDuration * 1000;

        this.configureUnits();
        this.scripter = this.getScripter();
        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport,
            this.mouseMove.bind(this));
        gameState.ship.showInScreen();

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

            _.each(gameState.ship.units(), function(u) {
                u.drawPath(ctx);
                if (u.selected) {
                    //draw rectangle around each selected unit
                    screen.drawTileHighlight(ctx, u.x(), u.y(),
                        'limegreen', 2);
                }
            });
            if (gameState.ship.isAt(mouse.x, mouse.y, 'unit')) {
                utils.setCursor('pointer');
            } else if(!this.dragBox){
                utils.setCursor('default')
            }

            //highlight where the mouse is pointing if it's a unit
            if (gameState.ship.isAt(mouse.x, mouse.y, 'unit') ||
                gameState.ship.selected().length > 0) {
                this.drawTileHighlight(ctx, mouse.x, mouse.y, 'teal', 1);
            }
            if (this.dragBox) {
                this.dragBox.draw(ctx);
                utils.setCursor('crosshair');
            }



        } else {
            utils.setCursor('default');
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
        var units = gameState.ship.units(),
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
        var units = gameState.ship.units(),
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
            this.releaseDragBox();
        }
    },
    mouseDown: function(e) {
        'use strict';
        var screen = this,
            mouse = utils.getMouse(),
            which = e.which - 1, //workaround for melonJS mismatch
            ship = gameState.ship;
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.RIGHT) {
            if (ship.selected().length > 0) {//there is a selected unit
                _.each(ship.selected(), function(unit){
                    screen.generateScripts(unit, mouse);
                });

            }
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
            _.each(gameState.ship.units(), function(u){
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
        var ship = gameState.ship,
            unit = ship.mapAt(x, y);
        this.unselectAll();
        if (unit && unit.name === 'unit') {
            unit.selected = true;
            return true;
        }
        return false;
    },
    unselectAll: function() {
        'use strict';
        _.each(gameState.ship.units(), function(u) {
            return u.selected = false;
        });
    },
    pause: function() {
        'use strict';
        $('#paused-indicator, #resume-button').show();
        _.each(gameState.ship.units(), function(u) {
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
        _.each(gameState.ship.units(), function(u) {
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
}));

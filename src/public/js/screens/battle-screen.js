/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, jsApp, ko, _ */

var BattleScreen = me.ScreenObject.extend({
    TURN_DURATION_SEC: 3,
    TURN_DURATION: 3000,
    name: 'battle-screen',
    isReset: false,
    paused: true,
    turnBeginTime: null,
    selected: [],//selected units
    pfFinder: new PF.BiAStarFinder({
        allowDiagonal: false
    }),
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
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
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
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this;
        $('#resume-button').click(function(){
            screen.resume();
        });
    },
    update: function() {
        if (!this.paused) {
            var elapsed = this.getElapsedTime();
            //update counter
            $('#elapsed').html(elapsed);
            if (elapsed >= this.TURN_DURATION) {
                this.pause();
            }
        }
    },
    draw: function(ctx){
        var screen = this;
        this.parent(ctx);
        if (this.paused) {
            ctx.beginPath();
            ctx.strokeStyle = 'limegreen';
            ctx.lineWidth = 2;
            _.each(this.selected, function(u){
                //draw rectangle around each selected unit
                ctx.moveTo(u.pos.x, u.pos.y);
                ctx.strokeRect(u.pos.x, u.pos.y, TILE_SIZE, TILE_SIZE);
            });
            _.each(me.game.ship.units(), function(u) {
                if(u.path.length > 0){
                    screen.drawPath(ctx, u.path,
                        u.getTilesTraversedGivenTime(screen.TURN_DURATION_SEC));
                }
            });
        }
    },
    mouseUp: function(e){
        var mouse = utils.getMouse(),
            which = e.which - 1; //workaround for melonJS mismatch
        if (!this.paused) {
            return;
        }
        if (which == me.input.mouse.LEFT) {
            this.selectUnit(mouse.x, mouse.y);
        }else if (which == me.input.mouse.RIGHT) {

        }
    },
    mouseDown: function(e){
        var mouse = utils.getMouse(),
            which = e.which - 1, //workaround for melonJS mismatch
            ship = me.game.ship,
            unit, grid, path;
        if (!this.paused) {
            return;
        }
        if (which == me.input.mouse.RIGHT) {
            if (this.selected[0]) {//there is a selected unit
                unit = this.selected[0];
                //output calculated arrival time
                //TODO: cache pf matrix on ship
                grid = new PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
                path = this.pfFinder.findPath(unit.x(), unit.y(),
                    mouse.x, mouse.y, grid);
                console.log('path length: '+ (path.length - 1));
                unit.path = path;
            }
        }
    },
    mouseMove: function(e) {
        //TODO show little square where the mouse is pointing
    },
    pathToPixels: function(path) {
        var newPath = [];
        for(var i = 0; i < path.length; i++){
            newPath.push([(path[i][0] * TILE_SIZE) + HALF_TILE,
                (path[i][1] * TILE_SIZE) + HALF_TILE]);
        }
        return newPath;
    },
    /**
     * Draws a movement path
     * @param ctx Canvas2DContext passed to the draw function
     * @param path a path given by Pathfinding
     * @param reachLength the length that the unit can traverse in the turn
     */
    drawPath: function(ctx, path, reachLength) {
        var outOfReach = false;
        if(path.length == 0)
        {
            return;
        }
        if(path.length == 1){
            console.warn('drawPath: path given to draw has 1 length');
            return;
        }
        path = this.pathToPixels(path);
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        ctx.moveTo(path[0][0], path[0][1]);
        for(var i = 1; i < path.length; i++){
            if (i === reachLength + 1) {
                ctx.beginPath();
                ctx.strokeStyle = 'orange';
                ctx.moveTo(path[i - 1][0], path[i - 1][1]);
                outOfReach = true;
            }
            ctx.lineTo(path[i][0], path[i][1]);
            ctx.stroke();
        }

        ctx.beginPath();
        if(outOfReach){
            ctx.fillStyle = 'orange';
        }else{
            ctx.fillStyle = 'green'
        }

        ctx.arc(path[path.length - 1][0], path[path.length - 1][1],
            HALF_TILE / 2, 0, Math.PI * 2, false);
        ctx.fill();
        //ctx.stroke();
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
        ship.addUnit(new Unit(empty.x + 1, empty.y));
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
            u.pause();
        });
        this.paused = true;
    },
    resume: function(){
        'use strict';
        var screen = this;
        $('#paused-indicator, #resume-button').hide();
        //reset time
        this.turnBeginTime = me.timer.getTime();
        _.each(me.game.ship.units(), function(u){
            u.generateScript(screen.TURN_DURATION);
            u.printScript();
            u.resume();
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


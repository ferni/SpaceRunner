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
    selected: [],//selected units
    pfFinder: new PF.AStarFinder({
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
        var screen = this,
            mouse = utils.getMouse(),
            mousePx;
        this.parent(ctx);
        if (this.paused) {
            ctx.beginPath();
            ctx.strokeStyle = 'limegreen';
            ctx.lineWidth = 2;
            _.each(this.selected, function(u) {
                //draw rectangle around each selected unit
                ctx.moveTo(u.pos.x, u.pos.y);
                ctx.strokeRect(u.pos.x, u.pos.y, TILE_SIZE, TILE_SIZE);
            });
            _.each(me.game.ship.units(), function(u) {
                if (u.path.length > 0) {
                    screen.drawPath(ctx, u.path,
                        u.getTilesTraversedGivenTime(screen.TURN_DURATION_SEC));
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
            ship = me.game.ship,
            unit, grid, path;
        if (!this.paused) {
            return;
        }
        if (which === me.input.mouse.RIGHT) {
            if (this.selected[0]) {//there is a selected unit
                unit = this.selected[0];
                //output calculated arrival time
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
    },
    pathToPixels: function(path) {
        'use strict';
        var newPath = [], i;
        for (i = 0; i < path.length; i++) {
            newPath.push([(path[i][0] * TILE_SIZE) + HALF_TILE,
                (path[i][1] * TILE_SIZE) + HALF_TILE]);
        }
        return newPath;
    },
    moveOrderImplementations: {
        avoidCollisionEndOfTurn: function(unit, destination){

        }
    },
    processMoveOrder: function(unit, destination){

    },
    /**
     * Draws a movement path.
     * @param {Canvas2DContext} ctx passed to the draw function.
     * @param {Array} path a path given by Pathfinding.
     * @param {int} reachLength the length that the unit can traverse in turn.
     */
    drawPath: function(ctx, path, reachLength) {
        'use strict';
        var outOfReach = false, i;
        if (path.length === 0) {
            return;
        }
        if (path.length === 1) {
            console.warn('drawPath: path given to draw has 1 length');
            return;
        }
        path = this.pathToPixels(path);
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        ctx.moveTo(path[0][0], path[0][1]);
        for (i = 1; i < path.length; i++) {
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
        if (outOfReach) {
            ctx.fillStyle = 'orange';
        }else {
            ctx.fillStyle = 'green';
        }

        ctx.arc(path[path.length - 1][0], path[path.length - 1][1],
            HALF_TILE / 2, 0, Math.PI * 2, false);
        ctx.fill();
        //ctx.stroke();
    },
    putUnits: function() {
        'use strict';
        //find empty spot
        var empty = null, ship = me.game.ship, unit;
        utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
                if (empty) {
                    return;
                }
                if (ship.mapAt(x, y) === charMap.codes._cleared) {
                    empty = {x: x, y: y};
                }
            });
        unit = new Unit(empty.x, empty.y);
        ship.add(unit);
        ship.add(new Unit(empty.x + 1, empty.y));
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
        this.selected.push(unit);
    },
    unselectAll: function() {
        'use strict';
        this.selected = [];
    },
    pause: function() {
        'use strict';
        $('#paused-indicator, #resume-button').show();
        _.each(me.game.ship.units(), function(u) {
            u.pause();
        });
        this.paused = true;
    },
    resume: function() {
        'use strict';
        var screen = this;
        $('#paused-indicator, #resume-button').hide();
        //reset time
        this.turnBeginTime = me.timer.getTime();
        _.each(me.game.ship.units(), function(u) {
            u.generateScript(screen.TURN_DURATION);
            u.printScript();
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


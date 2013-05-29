/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var Scripter = Object.extend({
    screen : {},
    init: function(screen) {
        'use strict';
        this.screen = screen;
    },

    generateScripts: function(unit, mouse) {},
    setUnitPath: function(unit, mouse) {
        'use strict';
        var grid, path,
            screen = this.screen,
            ship = me.game.ship;
        if (mouse.x === unit.x() && mouse.y === unit.y()) {
            unit.path = [];
        } else {
            grid = new PF.Grid(ship.width, ship.height,
                ship.getPfMatrix());
            path = screen.pfFinder.findPath(unit.x(), unit.y(),
                mouse.x, mouse.y, grid);
            console.log('path length: ' + (path.length - 1));
            if(path.length > 1) {
                unit.path = path;
            }
        }
    }

});

var DefaultScripter = Scripter.extend({
    generateScripts: function(unit, mouse){
        'use strict';
        var ship = me.game.ship,
            units = ship.units(),
            screen = this.screen;
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });
    }
});

var EndOfTurnScripter = Scripter.extend({
    /**
     * Generates scripts for the units resolving
     * any end-position conflicts.
     */
    generateScripts: function(unit, mouse){
        'use strict';
        var self = this,
            ship = me.game.ship,
            units = ship.units(),
            screen = this.screen,
            someScriptChanged;
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });
        //solve end positions conflicts
        do {
            someScriptChanged = false;
            _.each(units, function(u){
                while (self.posConflictsWithOtherEndPos(u, u.eotPos())) {
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
    }
});

var AvoidOtherPathsScripter = Scripter.extend({
    generateScripts: function(unit, mouse) {
        var ship = me.game.ship,
            units = ship.units(),
            screen = this.screen;
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });
    },
    setUnitPath: function(unit, mouse) {
        var ship = me.game.ship,
            units = ship.units(),
            grid, path, i,
            screen = this.screen;
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
            path = screen.pfFinder.findPath(unit.x(), unit.y(),
                mouse.x, mouse.y, grid);
            console.log('path length: ' + (path.length - 1));
            if(path.length > 1) {
                unit.path = path;
            }
        }
    }
});

var WaitForClearingScripter = Scripter.extend({

    generateScripts: function(unit, mouse){
        'use strict';
        var self = this,
            ship = me.game.ship,
            units = ship.units(),
            screen = this.screen,
            someScriptChanged = true,
        //when a unit blocks another (the other is waiting)
            unitBlockings = {};

        _.each(units, function(u){
            unitBlockings[u.GUID] = [];
        });
        this.highlightedTiles = [];
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(screen.TURN_DURATION);
        });

        do {
            if (!someScriptChanged) {
                throw 'infinite loop in waitForClearing collision solver';
            }
            someScriptChanged = false;
            _.each(units, function(u){
                var timeForTraversingTile = u.getTimeForOneTile(),
                    i, b, blocking, frame, clearStatus;
                for (i = 0; i < u.script.length; i++) {
                    frame = u.script[i];
                    clearStatus = self.getTileClearStatus(frame.pos, {
                        from: frame.time,
                        to: frame.time + timeForTraversingTile}, u);

                    if (!clearStatus.isClear) {
                        screen.highlightTile(frame.pos.x, frame.pos.y);
                        u.insertWait(i - 1, clearStatus.when - frame.time);
                        //register a 'unitBlocking' for each unit that blocks
                        (function(){
                            var waitIndex = i - 1;
                            _.each(clearStatus.unitsThatBlock, function(blocker) {
                                unitBlockings[blocker.unit.GUID].push({
                                    scriptIndex: blocker.frameIndex,
                                    undoWait: function(){
                                        u.removeWait(waitIndex);
                                    }
                                });
                            });
                        })();
                        //reset units' waiting that were being blocked
                        b = 0;
                        while (b < unitBlockings[u.GUID].length) {
                            blocking = unitBlockings[u.GUID][b];
                            if (blocking.scriptIndex > i) {
                                blocking.undoWait();
                                unitBlockings[u.GUID].splice(b, 1);
                            } else {
                                b++;
                            }
                        }
                        someScriptChanged = true;
                    }
                }
            });
        } while(someScriptChanged)
    },
    handleTileTrafficChanged: function(x, y){

    },
    /**
     * Returns true if the tile is clear for the timeWindow
     * @param pos {Object} the position for the tile.
     * @param timeWindow {Object} a time window containing from and to.
     * @param excludedUnit
     */
    getTileClearStatus: function(pos, timeWindow, excludedUnit) {
        'use strict';
        //TODO: change 'frames' to a more accurate name
        var frames = [],
            i,
            occupyWindow,
            maxOverlapping,
            clearStatus = {
                isClear : true,
                when : null,
                unitsThatBlock: []
            };
        //get the frames that are at that position
        //TODO: maybe use a reservation table
        _.each(me.game.ship.units(), function(u){
            if(u !== excludedUnit && u.willMove()){
                _.each(u.script, function(f, index){
                    if(f.pos.x === pos.x && f.pos.y === pos.y){
                        frames.push({unit: u, frameIndex: index, f: f});
                    }
                });
            }
        });
        if (frames.length === 0) {
            //is clear
            return clearStatus;
        }

        //find out when will the tile be clear
        do{
            maxOverlapping = 0;
            for (i = 0; i < frames.length; i++) {
                occupyWindow = frames[i].unit.getTimeWindow(
                    frames[i].frameIndex
                );
                if (utils.windowsOverlap(occupyWindow, timeWindow)) {
                    clearStatus.isClear = false;
                    clearStatus.unitsThatBlock.push(frames[i]);
                    if (occupyWindow.to > maxOverlapping) {
                        maxOverlapping = occupyWindow.to;
                    }
                }
            }
            if(maxOverlapping > 0) {
                timeWindow = {
                    from: maxOverlapping,
                    to: maxOverlapping + (timeWindow.to - timeWindow.from)
                }
            }
        }
        while(maxOverlapping > 0);

        if (!clearStatus.isClear) {
            clearStatus.when = timeWindow.from;//is clear from that time
        }
        return clearStatus;
    }
});
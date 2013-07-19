/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var Scripter = Object.extend({
    init: function(turnDuration) {
        'use strict';
        this.pfFinder = new PF.AStarFinder({
            allowDiagonal: true
        });
        this.turnDuration = turnDuration;
    },

    generateScripts: function(unit, mouse) {},
    setUnitPath: function(unit, mouse) {
        'use strict';
        var grid, path,
            ship = gs.ship;
        if (mouse.x === unit.x && mouse.y === unit.y) {
            unit.path = [];
        } else {
            grid = new PF.Grid(ship.width, ship.height,
                ship.getPfMatrix());
            grid = this.processGrid(grid, unit, mouse);
            path = this.pfFinder.findPath(unit.x, unit.y,
                mouse.x, mouse.y, grid);
            console.log('path length: ' + (path.length - 1));
            if(path.length > 1) {
                unit.path = path;
            }
        }
    },
    processGrid: function(grid, unit, mouse) {
        'use strict';
        return grid;
    }

});

var DefaultScripter = Scripter.extend({
    generateScripts: function(unit, mouse){
        'use strict';
        var ship = gs.ship,
            units = ship.units,
            self = this;
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(self.turnDuration);
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
            ship = gs.ship,
            units = ship.units,
            someScriptChanged;
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(self.turnDuration);
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
        'use strict';
        var ship = gs.ship;
        return _.any(ship.units, function(u){
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
        'use strict';
        var ship = gs.ship,
            units = ship.units,
            self = this;
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(self.turnDuration);
        });
    },
    processGrid: function(grid, unit, mouse) {
        'use strict';
        var units = gs.ship.units,
            i;
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
                    grid.setWalkableAt(u.x, u.y, false);
                }
            }
        });
        return grid;
    }
});

var WaitForClearingScripter = Scripter.extend({

    generateScripts: function(unit, mouse){
        'use strict';
        var self = this,
            ship = gs.ship,
            units = ship.units,
            someScriptChanged = true,
        //when a unit blocks another (the other is waiting)
            unitBlockings = {};

        _.each(units, function(u){
            unitBlockings[u.GUID] = [];
        });
        if (unit && mouse) {
            this.setUnitPath(unit, mouse);
        }
        _.each(units, function(u){
            u.generateScript(self.turnDuration);
        });

        do {
            if (!someScriptChanged) {
                throw 'infinite loop in waitForClearing collision solver';
            }
            someScriptChanged = false;
            _.each(units, function(u){
                var timeForTraversingTile = u.getTimeForOneTile(),
                    i, b, blocking, frame, clearStatus;
                for (i = 1; i < u.script.length; i++) {
                    frame = u.script[i];
                    clearStatus = self.getTileClearStatus(frame.pos, {
                        from: frame.time,
                        to: frame.time + timeForTraversingTile}, u);

                    if (!clearStatus.isClear) {
                        if (clearStatus.when) {
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
                            i++;
                        }
                        else { //is never gonna clear up
                            //remove rest of the script
                            u.script.splice(i, u.script.length - i);
                            someScriptChanged = true;
                            break;
                        }


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
        if (timeWindow.from === timeWindow.to) {
            throw 'getTileClearStatus should not process instant timeWindow ' +
                '(from = to)';
        }
        _.each(gs.ship.units, function(u){
            if (u !== excludedUnit) {
                if (u.willMove()) {
                    _.each(u.script, function (f, index) {
                        if (f.pos.x === pos.x && f.pos.y === pos.y) {
                            frames.push({unit: u, frameIndex: index, f: f});
                        }
                    });
                } else if(u.x === pos.x && u.y === pos.y) {
                    clearStatus.isClear = false;
                    clearStatus.when = false;
                    return clearStatus;
                }
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
                    if (frames[i].frameIndex ===
                        frames[i].unit.script.length - 1) {//last frame
                        clearStatus.when = false;
                        return clearStatus;
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
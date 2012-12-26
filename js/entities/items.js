/*
    In each item, set size and type before calling parent()
*/
// weapon object
var iWeaponObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "weapon";
        this.size = [2, 2];
        this.totalSize = [3, 2];
        this.parent(x, y, settings, true);
    },
    buildPlacementRules: function () {
        this.parent();
        this.placementRules.push(new pr.PlacementRule({ tile: charMap.codes._front,
            inAny: [{ x: 2, y: 0 }, { x: 2, y: 1}]
        }));
    }
});

// engine object
var iEngineObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "engine";
        this.size = [2, 2];
        this.totalSize = [3, 2];
        this.cannonTile = [1, 0];
        this.parent(x, y, settings);
    },
    buildPlacementRules: function () {
        this.parent();
        this.placementRules.push(new pr.PlacementRule({ tile: charMap.codes._back,
            inAll: [{ x: -1, y: 0 }, { x: -1, y: 1}]
        }));
    }
});


// power object
var iPowerObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "power";
        this.size = [2, 2];
        this.parent(x, y, settings);
    }
});

// console object class
var iConsoleObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "console";
        this.size = [1, 1];
        this.parent(x, y, settings);
    },
    buildPlacementRules: function () {
        this.parent();
        this.placementRules.push(pr.make.nextToRule(function (tile) {
            return tile.type == "weapon" || tile.type == "engine" || tile.type == "power";
        }, this.size[0], this.size[1]));
    }
});

// component object class
var iComponentObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "component";
        this.size = [2, 2];
        this.parent(x, y, settings, this.mResource);
        // add animation
        this.addAnimation("idle", [3]);
        this.addAnimation("charge", [0, 1, 2, 3, 4, 5, 5]);
        // set animation
        this.offShipAnimations = ["idle"];
        this.onShipAnimations = ["charge"];
        this.animationspeed = 15;
    }
});

// door object class
var iDoorObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "door";
        this.size = [2, 1];
        this.parent(x, y, settings);
        // add animation
        this.addAnimation("idle", [2]);
        this.addAnimation("h_open_close", [0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 2, 0]);
        this.addAnimation("v_open_close", [1, 3, 5, 7, 9, 11, 11, 9, 7, 5, 3, 1]);
        this.anchorPoint.x = 0.25;
        this.anchorPoint.y = 0.5;
        // set animation
        this.offShipAnimations = ["idle"];
        this.onShipAnimations = ["h_open_close", "v_open_close"];
        this.animationspeed = 10;
        this.zIndex = 110;
    },
    buildPlacementRules: function () {
        //doesn't use inherited placementRules
        this.placementRules = [pr.make.spaceRule(function (tile) {
            return _.isFunction(tile.isCurrentAnimation)
                                                         && tile.isCurrentAnimation("lrWall");
        }, 2, 1)];
        this.rotatedPlacementRules = [pr.make.spaceRule(function (tile) {
            return _.isFunction(tile.isCurrentAnimation)
                                                         && tile.isCurrentAnimation("tbWall");
        }, 1, 2)];
    },
    canBuildRotated: function (x, y) {
        return _.every(this.rotatedPlacementRules, function (r) {
            return r.compliesAt(x, y, ship.map());
        });
    }

});
// wall object class
var iWallObject = ItemObject.extend({
    // init function
    init: function (x, y, settings) {
        this.type = "wall";
        this.size = [1, 1];
        this.parent(x, y, settings);
        // add animation
        //Wall connects: t=top, l=left, b=bottom, r=right
        this.addAnimation("lrWall", [0]);
        this.addAnimation("tbWall", [1]);
        this.addAnimation("trWall", [2]);
        this.addAnimation("tlrWall", [3]);
        this.addAnimation("tlbrWall", [4]);
        this.addAnimation("tlWall", [5]);
        this.addAnimation("brWall", [6]);
        this.addAnimation("lbrWall", [7]);
        this.addAnimation("lbWall", [8]);
        this.addAnimation("tlbWall", [9]);
        this.addAnimation("tbrWall", [10]);
        // set animation
        this.setCurrentAnimation("lrWall");
        this.animationspeed = 6;
    },
    updateAnimation: function () {
        if (window.ship === undefined) return;
        var wallsAround = [];
        var x = this._x;
        var y = this._y;
        var top = ui.mapAt(x, y - 1);
        var left = ui.mapAt(x - 1, y);
        var bottom = ui.mapAt(x, y + 1);
        var right = ui.mapAt(x + 1, y);
        if (top != null && (top.type == "wall" || (top.type == "door" && top.rotated() && top.y() == y - 2)))
            wallsAround.push("t");
        if (left != null && (left.type == "wall" || (left.type == "door" && !left.rotated() && left.x() == x - 2)))
            wallsAround.push("l");
        if (bottom != null && (bottom.type == "wall" || (bottom.type == "door" && bottom.rotated() && bottom.y() == y + 1)))
            wallsAround.push("b");
        if (right != null && (right.type == "wall" || (right.type == "door" && !right.rotated() && right.x() == x + 1)))
            wallsAround.push("r");
        if (wallsAround.length == 0) {
            this.setCurrentAnimation("lrWall"); //default
            return;
        }
        if (wallsAround.length == 1) {//just one connection
            if (wallsAround[0] == "t" || wallsAround[0] == "b") {
                this.setCurrentAnimation("tbWall");
                return;
            }
            if (wallsAround[0] == "l" || wallsAround[0] == "r") {
                this.setCurrentAnimation("lrWall");
                return;
            }
        }
        wallsAround.push("Wall");
        var animationName = wallsAround.join("");
        this.setCurrentAnimation(animationName);
    },
    removeObject: function () {
        me.game.remove(this);
        delete this;
    },
    update: function () {
        this.updateAnimation();
    },
    onBuilt: function () {
        this.parent();

        if (ui.mouseLockedOn == this) return;

        var pfMatrix = utils.getEmptyMatrix(WIDTH, HEIGHT, 1);
        utils.levelTiles(function (x, y) {
            if (ship.map()[y][x] == charMap.codes._cleared)
                pfMatrix[y][x] = 0; //cleared tiles are walkable
        });
        pfMatrix[this.y()][this.x()] = 0; //self tile will be walkable for pathfinding purposes
        this.grid = new PF.Grid(WIDTH, HEIGHT, pfMatrix);

        var t = this.temp;
        t.preMouseX = this.x();
        t.preMouseY = this.y();
        t.pivotX = this.x();
        t.pivotY = this.y();
        t.paths = [];
        t.lastPath = 0;
        ui.mouseLockedOn = this;
    },
    lockedMouseMove: function (mouseTile) {
        this.parent();
        var t = this.temp;

        if ((mouseTile.x == t.pivotX && mouseTile.y == t.pivotY)
          || (mouseTile.x == t.preMouseX && mouseTile.y == t.preMouseY))
            return;
        t.preMouseX = mouseTile.x;
        t.preMouseY = mouseTile.y;
        ui.clear();
        var finder = new PF.BestFirstFinder();
        var cloneGrid = this.grid.clone();
        var path = finder.findPath(t.pivotX, t.pivotY, mouseTile.x, mouseTile.y, cloneGrid);

        t.paths[t.lastPath] = path; //replace last path
        for (var i = t.paths.length - 1; i >= 0; i--) {
            for (var f = 1; f < t.paths[i].length; f++) {
                ui.draw(t.paths[i][f][0], t.paths[i][f][1], "wall");
            }
        };
    },
    lockedMouseUp: function (mouseTile) {
        this.parent();
        var t = this.temp;

        t.pivotX = mouseTile.x;
        t.pivotY = mouseTile.y;
        t.lastPath++;

    },
    lockedMouseDbClick: function (mouseTile) {
        this.parent();
        _.each(ui.drawingScreen, function (wall) {
            ship.buildAt(wall.x(), wall.y(), "wall");
        });
        ui.clear();

        ui.mouseLockedOn = null;
    },
    lockedEscape: function () {
        ui.clear();

        ui.mouseLockedOn = null;
        ship.remove(this);
    }
});
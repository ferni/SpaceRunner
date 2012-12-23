
// weapon object 
var iWeaponObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.size = [2, 2];
        this.mResource = items.weapon.index;
        this.mid = mID;
        this.charCode = items.weapon.code;
        this.parent(x, y, settings, this.mResource);
        
    },
    buildPlacementRules : function() {
        this.parent();
        this.placementRules.push(new pr.PlacementRule({tile:charMap.codes._front, 
                                                       inAny:[{ x: 2, y: 0 }, { x: 2, y: 1 }]}));
    }
    
});
// engine object 
var iEngineObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.engine.index;
        this.mid = mID;
        this.size = [2, 2];
        this.cannonTile = [1, 0];
        this.charCode = items.engine.code;
        this.parent(x, y, settings, this.mResource);
    },
    buildPlacementRules : function() {
        this.parent();
        this.placementRules.push(new pr.PlacementRule({tile:charMap.codes._back, 
                                                       inAll:[{ x: -1, y: 0 }, { x: -1, y: 1 }]}));
    }
    
});


// power object 
var iPowerObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.power.index;
        this.mid = mID;
        this.size = [2, 2];
        this.charCode = items.power.code;
        this.parent(x, y, settings, this.mResource);
    }
    
});

// console object class 
var iConsoleObject = ItemObject.extend({
    
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.console.index;
        this.mid = mID;
        this.size = [1, 1];
        this.charCode = items.console.code;
        this.parent(x, y, settings, this.mResource);
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
    init : function(x, y, settings, mID){
        this.mResource = items.component.index;
        this.mid = mID;
        this.size = [2, 2];
        //image sprite width / height
        settings.spritewidth = 64;
        settings.spriteheight = 64;
        this.charCode = items.component.code;
        this.parent(x, y, settings, this.mResource);
        // add animation
        this.addAnimation ("idle", [3]);
        this.addAnimation ("charge", [0, 1, 2, 3, 4, 5, 5]);
        // set animation
        this.setCurrentAnimation("idle");
        this.animationspeed = 15;
    },
    onBuilt: function(){
        this.setCurrentAnimation("charge");
    }
});
// door object class 
var iDoorObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        this.mResource = items.door.index;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 64;
        settings.spriteheight = 32;
        this.charCode = items.door.code;
        this.size = [2, 1];
        this.parent(x, y, settings, this.mResource);
        // add animation
        this.addAnimation ("idle",  [2]);
//        this.addAnimation ("v_open_close",  [10]);
        this.addAnimation ("v_open_close",  [0, 2, 4, 6, 8, 10, 10, 8, 6, 4, 2, 0]);
        this.addAnimation ("h_open_close",  [1, 3, 5, 7, 9, 11, 11, 9, 7, 5, 3, 1]);
        this.anchorPoint.x = 0.25;
        this.anchorPoint.y = 0.5;
        // set animation
        this.setCurrentAnimation("idle");
        this.animationspeed = 10;
        this.zIndex = 110;
        this.mfix = false;
        window.changed = 0;
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
    canBuildRotated: function(x,y){
        return _.every(this.rotatedPlacementRules, function(r) {
            return r.compliesAt(x, y, ship.map());
        });
    },
    onBuilt: function () {
        if(this.rotated()) {
            this.setCurrentAnimation("h_open_close");
        }else {
            this.setCurrentAnimation("v_open_close");
        }
    }
    
});
// wall object class
var iWallObject = ItemObject.extend({
    // init function
    init : function(x, y, settings, mID){
        var self = this;
        this.mResource = items.wall.index;
        this.mid = mID;
        //image sprite width / height
        settings.spritewidth = 32;
        settings.spriteheight = 32;
        
        this.size = [1, 1];
        this.charCode = items.wall.code;
        this.parent(x, y, settings, this.mResource);
        // add animation
        // add animation
        //Wall connects: t=top, l=left, b=bottom, r=right
        this.addAnimation ("lrWall", [0]);
        this.addAnimation ("tbWall", [1]);
        this.addAnimation ("trWall", [2]);
        this.addAnimation ("tlrWall", [3]);
        this.addAnimation ("tlbrWall", [4]);
        this.addAnimation ("tlWall", [5]);
        this.addAnimation ("brWall", [6]);
        this.addAnimation ("lbrWall", [7]);
        this.addAnimation ("lbWall", [8]);
        this.addAnimation ("tlbWall", [9]);
        this.addAnimation ("tbrWall", [10]);
        // set animation
        this.setCurrentAnimation("lrWall");
        this.animationspeed = 6;
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    onMouseDown : function() {

    },
    onMouseUp : function(){

    },
    updateAnimation : function()
    {
        if(window.ship === undefined) return;
        var wallsAround = [];
        var x = this._x;
        var y = this._y;
        var top = ui.mapAt(x, y - 1);
        var left = ui.mapAt(x - 1, y);
        var bottom = ui.mapAt(x, y + 1);
        var right = ui.mapAt(x + 1, y);
        if(top != null && (top.type == "wall" || (top.type == "door" && top.rotated() && top.y() == y - 2)))
            wallsAround.push("t");
        if(left != null && (left.type == "wall" || (left.type == "door" && !left.rotated() && left.x() == x - 2)))
            wallsAround.push("l");
        if(bottom != null && (bottom.type == "wall" ||(bottom.type == "door" && bottom.rotated() && bottom.y() == y + 1)))
            wallsAround.push("b");
        if(right != null && (right.type == "wall" || (right.type == "door" && !right.rotated() && right.x() == x + 1)))
            wallsAround.push("r");
        if(wallsAround.length == 0) {
            this.setCurrentAnimation("lrWall");//default
            return;
        }
        if(wallsAround.length == 1) {//just one connection
            if(wallsAround[0] == "t" || wallsAround[0] == "b") {
                this.setCurrentAnimation("tbWall");
                return;
            }
            if(wallsAround[0] == "l" || wallsAround[0] == "r") {
                this.setCurrentAnimation("lrWall");
                return;
            }
        }
        wallsAround.push("Wall");
        var animationName = wallsAround.join("");
        this.setCurrentAnimation(animationName);
    },
    removeObject : function(){
        me.game.remove(this);
        delete this;
    },
    update : function(){
        this.updateAnimation();
    },
    onBuilt: function(){
        this.parent();
        

        if(ui.mouseLockedOn == this) return;

        var pfMatrix = utils.getEmptyMatrix(WIDTH, HEIGHT, 1);
        utils.levelTiles(function(x,y) {
            if(ship.map()[y][x] == charMap.codes._cleared)
                pfMatrix[y][x] = 0;//cleared tiles are walkable
        });
        pfMatrix[this.y()][this.x()] = 0;//self tile will be walkable for pathfinding purposes
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

        if((mouseTile.x == t.pivotX && mouseTile.y == t.pivotY)
          || (mouseTile.x == t.preMouseX && mouseTile.y == t.preMouseY)) 
            return;
        t.preMouseX = mouseTile.x;
        t.preMouseY = mouseTile.y;
        ui.clear();
        var finder = new PF.BestFirstFinder();
        var cloneGrid = this.grid.clone();
        var path = finder.findPath(t.pivotX, t.pivotY, mouseTile.x, mouseTile.y, cloneGrid);
        
        t.paths[t.lastPath] = path;//replace last path
        for (var i = t.paths.length - 1; i >= 0; i--) {
            for(var f = 1; f < t.paths[i].length; f++){
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
        _.each(ui.drawingScreen, function(wall) {
            ship.buildAt(wall.x(), wall.y(), "wall");
        });
        ui.clear();

        ui.mouseLockedOn = null;
    },
    lockedEscape: function(){
        ui.clear();

        ui.mouseLockedOn = null;
        ship.remove(this);
    }
});
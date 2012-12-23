/* An object that has tile position (x and y), and row length and col length through "size"*/
var TileObject = me.ObjectEntity.extend({
    _x: 0, //column
    _y: 0, //row
    size: [1, 1],
    cannonTile: [0, 0], //image offset
    init: function (x, y, settings) {
        this.parent(x, y, settings);
        this.x(x);
        this.y(y);
    },
    x: function (x) {//sets or gets the column at which it is located
        if (x === undefined) return this._x;
        if (x == this._x) return this;
        this.pos.x = (x - this.cannonTile[0]) * TILE_SIZE;
        this._x = x;
        this.onPositionChange();
        return this;
    },
    y: function (y) {//sets or gets the row
        if (y === undefined) return this._y;
        if (y == this._y) return this;
        this.pos.y = (y - this.cannonTile[1]) * TILE_SIZE;
        this._y = y;
        this.onPositionChange();
        return this;
    },
    onPositionChange: function () {
        //it's abstract; does nothing
    },
    zIndex : 100
});


/* individual object class */
var ItemObject = TileObject.extend({
    mfix: false,
    mid: 0,
    isDrag: false,
    preX: 0,
    preY: 0,
    
    init: function (x, y, settings, iIndex) {

        if (iIndex >= 0) {
            settings.image = g_resources_size[iIndex].name;
            this.parent(x, y, settings);
            this.gravity = 0;
            this.collidable = true;
            this.type = g_resources_size[iIndex].name;
            this.updateColRect(1, g_resources_size[iIndex].width - 1, 1, g_resources_size[iIndex].height - 1);
            this.buildPlacementRules();
            this.name = "Building";
            
        }
        me.input.registerMouseEvent("mousedown", this, this.onMouseDown.bind(this));
        me.input.registerMouseEvent("mouseup", this, this.onMouseUp.bind(this));
    },
    /* check if obj contains the specified line 
    sPos : start position
    ePos : end position
    */
    containLine: function (obj, sPos, ePos) {
        if (obj.containsPoint(sPos) && obj.containsPoint(ePos))
            return true;
        return false;
    },
    onCollision: function (res, obj) {
    },

    //drag functionality
    onMouseDown: function () {
        if (select_item == -1) {
            this.isDrag = true;
            SelectObject = this;
            select_item = this.mResource;
            isDragable = true;

            this.preX = this.pos.x;
            this.preY = this.pos.y;
            this.setWalkable();
            displayMoveCursor();
        }
    },
    onMouseUp: function () {
        if (this.isDrag == true) {
            DeleteObject = this;
            this.isDrag = false;
            SelectObject = null;
            select_item = -1;
            isDragable = false;
            if (checkCollision.processCollision(this)) {
                checkCollision.removeRedStyle();
                this.pos.x = this.preX;
                this.pos.y = this.preY;
            }
            this.setUnWalkable();
            displayDefaultCursor();
        }
    },
    /*functions to do when mouse-locked (override in each item)*/
    lockedMouseUp: function (mouseTile) {
    },
    lockedMouseDown: function (mouseTile) {
    },
    lockedMouseMove: function (mouseTile) {
    },
    lockedMouseDbClick: function (mouseTile) {
    },
    setWalkable: function () {
        MapMatrix.setWalkable(this.pos.x, this.pos.y, this.width, this.height);
    },
    setUnWalkable: function () {
        MapMatrix.setUnWalkable(this.pos.x, this.pos.y, this.width, this.height);
    },
    placementRules: []
    ,
    buildPlacementRules: function () {
        this.placementRules = new Array();
        this.placementRules.push(pr.make.spaceRule(charMap.codes._cleared, this.size[0], this.size[1]));
    },

    canBuildAt: function (x, y) {
        return _.every(this.placementRules, function (r) { return r.compliesAt(x, y, ship.map()); });
    },
    canBuildRotated: function (x, y) {
        return false;
    }
    ,
    _rotated: false,
    rotated: function (rotated) {
        if (rotated === undefined) return this._rotated;
        if (rotated) {
            this.angle = Math.PI / 2;
        } else {
            this.angle = 0;
        }
        this._rotated = rotated;
        return this;
    },
    //takes rotation into account
    trueSize: function (index) {
        if (index === undefined) {//can pass an index: 0= width, 1= height (like the size object)
            return this.rotated() ? [this.size[1], this.size[0]] : this.size;
        } else {
            if (this.rotated()) {
                index = (index == 1) ? 0 : 1; //toggles 1 and 0
            }
            return this.size[index];
        }
    },
    //returns true is some part of the item is occupying the tile
    occupies: function (x, y) {
        var occupies = false;
        utils.itemTiles(this, function (tX, tY) {
            if (x == tX && y == tY) occupies = true;
        });
        return occupies;
    },
    onBuilt: function () {
        //abstract method
    },
    temp: {}//for storing temporary stuff


});

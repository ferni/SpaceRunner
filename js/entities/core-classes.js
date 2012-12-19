/* An object that has tile position (x and y), and row length and col length through "size"*/
var TileObject = me.ObjectEntity.extend({
    _x: 0, //column
    _y: 0, //row
    x: function (x) {//sets or gets the column at which it is located
        if (x === undefined) return this._x;
        if (x == this._x) return this;
        this.pos.x = (x - this.cannonTile[0]) * TILE_SIZE;
        this._x = x;
        return this;
    },
    y: function (y) {//sets or gets the row
        if (y === undefined) return this._y;
        if (y == this._y) return this;
        this.pos.y = (y - this.cannonTile[1])* TILE_SIZE;
        this._y = y;
        return this;
    },

    size: [1, 1],
    cannonTile: [0, 0],//image offset
    init: function (x, y, settings) {
        this.parent(x, y, settings);
        this.x(x);
        this.y(y);
    }
});


/* individual object class */
var ItemObject = TileObject.extend({
    mfix: false,
    mid: 0,
    isDrag: false,
    preX: 0,
    preY: 0,
    
    greenSpotsForPlacement: [],
    init: function (x, y, settings, iIndex) {
        if (iIndex >= 0) {
            settings.image = g_resources_size[iIndex].name;
            this.parent(x, y, settings);
            this.gravity = 0;
            this.collidable = true;
            this.type = g_resources_size[iIndex].name;
            this.updateColRect(1, g_resources_size[iIndex].width - 1, 1, g_resources_size[iIndex].height - 1);
            this.buildPlacementRules();
            this.greenSpotsForPlacement = pr.spots.getAllowedSpots(charMap.get(), this.placementRules, this.size, this.cannonTile);
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

    // ------ Collisions ------
    checkOutlineCollision: function () {
        var position = jsApp.getTilePosition(this.pos.x, this.pos.y);
        position.x += this.cannonTile[0];
        position.y += this.cannonTile[1];
        var isClear = this.greenSpotsForPlacement[position.y][position.x] == pr.spots.allowed;
        for (var x = position.x; x < position.x + this.size[0]; x++) {
            for (var y = position.y; y < position.y + this.size[1]; y++) {
                if (this.greenSpotsForPlacement[y][x] == pr.spots.forbidden) {
                    checkCollision.printRedStyle(x, y, true);
                }
            }
        }
        return isClear;
    },

    checkObjectCollision: function () {
        var res = me.game.collide(this);
        var checkPoint = new me.Vector2d(0, 0);
        if (!res)
            return true;
        for (checkPoint.x = this.pos.x + 1; checkPoint.x < this.pos.x + this.width; checkPoint.x += TILE_SIZE) {
            for (checkPoint.y = this.pos.y + 1; checkPoint.y < this.pos.y + this.height; checkPoint.y += TILE_SIZE) {
                this.updateColRect(checkPoint.x - this.pos.x, TILE_SIZE - 2, checkPoint.y - this.pos.y, TILE_SIZE - 2);
                res = me.game.collide(this);
                if (res) {
                    checkCollision.printRedStyle(checkPoint.x - 1, checkPoint.y - 1);
                }
            }
        }
        this.updateColRect(0, this.width, 0, this.height);

        delete checkPoint;
        /* process red style rect */
        return false;
    },
    /*This is the general, all-encompassing function for checking collisions*/
    processCollision: function () {
        var collides = true;
        /* remove red style */
        checkCollision.removeRedStyle();
        /* check collision */
        var objectsClear = this.checkObjectCollision();
        var outlineClear = this.checkOutlineCollision();

        if (objectsClear && outlineClear)
            collides = false;
        return collides;
    },
    canBuildAt: function (x, y) {
        return _.every(this.placementRules, function (r) { return r.compliesAt(x, y, charMap.get()); });
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
    }


});

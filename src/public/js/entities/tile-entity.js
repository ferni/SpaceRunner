/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, hullMap, pr, TILE_SIZE*/

/* An object that has tile position (x and y),
    and row length and col length through "size"
*/
var TileEntity = me.ObjectEntity.extend({
    _x: 0, //column
    _y: 0, //row
    size: [1, 1],
    cannonTile: [0, 0], //image offset
    init: function(x, y, settings) {
        'use strict';
        if (this.type !== 0) {
            settings.image = this.type;
        }
        if (!this.totalSize) {
            this.totalSize = [this.size[0], this.size[1]];
        }
        settings.spritewidth = this.totalSize[0] * TILE_SIZE;
        settings.spriteheight = this.totalSize[1] * TILE_SIZE;
        this.parent(x, y, settings);
        //restore type reset on this.parent()
        this.type = settings.image;
        this.x(x);
        this.y(y);
    },
    x: function(x) { //sets or gets the column at which it is located
        'use strict';
        if (x === undefined) {
            return this._x;
        }
        if (x === this._x) {
            return this;
        }
        if (!this.hidden()) {
            this.pos.x = (x - this.cannonTile[0]) * TILE_SIZE;
        }
        this._x = x;
        this.onPositionChange();
        return this;
    },
    y: function(y) { //sets or gets the row
        'use strict';
        if (y === undefined) {
            return this._y;
        }
        if (y === this._y) {
            return this;
        }
        if (!this.hidden()) {
            this.pos.y = (y - this.cannonTile[1]) * TILE_SIZE;
        }
        this._y = y;
        this.onPositionChange();
        return this;
    },
    _hidden: false,
    hidden: function(hide) {
        'use strict';
        if (hide === undefined) {
            return this._hidden;
        }
        if (hide) {
            this.pos.x = -400;
            this.pos.y = 0;
        } else {
            this.pos.x = this._x * TILE_SIZE;
            this.pos.y = this._y * TILE_SIZE;
        }
        this._hidden = hide;
        return this;
    },
    show: function() {
        'use strict';
        this.hidden(false);
        return this;
    },
    hide: function() {
        'use strict';
        this.hidden(true);
        return this;
    },
    onPositionChange: function() {
        'use strict';
        //it's abstract; does nothing
    },
    zIndex: 100
});





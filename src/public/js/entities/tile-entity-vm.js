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
var TileEntityVM = me.ObjectEntity.extend({
    x: 0, //column
    y: 0, //row
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
        if (typeof settings.spritewidth === 'undefined') {
            settings.spritewidth = this.totalSize[0] * TILE_SIZE;
        }
        if (typeof settings.spriteheight === 'undefined') {
            settings.spriteheight = this.totalSize[1] * TILE_SIZE;
        }
        this.parent(x, y, settings);
        //restore type reset on this.parent()
        this.type = settings.image;
        this.setX(x);
        this.setY(y);
    },
    setX: function(x) { //sets the column at which it is located
        'use strict';
        if (x === this.x) {
            return this;
        }
        this.pos.x = (x - this.cannonTile[0]) * TILE_SIZE;
        this.x = x;
        this.onPositionChange();
        return this;
    },
    setY: function(y) { //sets the row
        'use strict';
        if (y === this.y) {
            return this;
        }
        this.pos.y = (y - this.cannonTile[1]) * TILE_SIZE;
        this.y = y;
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
            this.alpha = 0;
        } else {
            this.alpha = 1;
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

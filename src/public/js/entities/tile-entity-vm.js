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
    isSelectable: false,
    selected: false,
    init: function(x, y, settings) {
        'use strict';
        var type;
        if (this.type !== 0) {
            type = this.type;
            settings.image = this.type.toLowerCase();
        }
        if (!this.totalSize) {
            this.totalSize = [this.size[0], this.size[1]];
        }
        if (settings.spritewidth === undefined) {
            settings.spritewidth = this.totalSize[0] * TILE_SIZE;
        }
        if (settings.spriteheight === undefined) {
            settings.spriteheight = this.totalSize[1] * TILE_SIZE;
        }
        this.parent(x, y, settings);
        //restore type reset on this.parent()
        this.type = type;
        this.setX(x);
        this.setY(y);

        me.input.registerMouseEvent('mousedown', this,
            this.onMouseDown.bind(this));
        me.input.registerMouseEvent('mouseup', this,
            this.onMouseUp.bind(this));
    },
    update: function() {
        'use strict';
        this.parent();
        if (this.occupies(utils.lastMouse)) {
            if (!this.isMouseOver) {
                this.onMouseEnter();
                this.isMouseOver = true;
            }
        } else {
            if (this.isMouseOver) {
                this.onMouseLeave();
                this.isMouseOver = false;
            }
        }
        return true;
    },
    onMouseDown: function() {
        'use strict';
        //console.log('mouse down on ' + this.type);
    },
    onMouseUp: function() {
        'use strict';
        //console.log('mouse up on ' + this.type);
        if (this.isSelectable) {
            this.selected = true;
        }
    },
    onMouseEnter: function() {
        'use strict';
        //console.log('mouse entered ' + this.type);
        if (this.isSelectable) {
            utils.setCursor('pointer');
        }
    },
    onMouseLeave: function() {
        'use strict';
        //console.log('mouse left ' + this.type);
        if (this.isSelectable) {
            utils.setCursor('default');
        }
    },
    setX: function(x) { //sets the column at which it is located
        'use strict';
        if (x === this.x) {
            return this;
        }
        this.x = x;
        this.pos.x = (this.x - this.cannonTile[0]) * TILE_SIZE;
        return this;
    },
    setY: function(y) { //sets the row
        'use strict';
        if (y === this.y) {
            return this;
        }
        this.y = y;
        this.pos.y = (this.y - this.cannonTile[1]) * TILE_SIZE;
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
    trueSize: function(index) {
        'use strict';
        //(only items can rotate, not units)
        return this.size[index];
    },
    occupies: function(tile) {
        'use strict';
        var x = tile.x, y = tile.y;
        return x >= this.x && x < this.x + this.trueSize(0) &&
            y >= this.y && y < this.y + this.trueSize(1);
    },
    /**
     * OnDestroy notification function<br>
     * Called by engine before deleting the object<br>
     * be sure to call the parent function if overwritten
     */
    onDestroyEvent: function() {
        'use strict';
        me.input.releaseMouseEvent('mousedown', this);
        me.input.releaseMouseEvent('mouseup', this);
    },
    zIndex: 100
});

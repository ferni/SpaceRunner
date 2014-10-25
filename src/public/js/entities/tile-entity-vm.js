/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, utils, hullMap, pr, TILE_SIZE, gs, sh*/

/* An object that has tile position (x and y),
 and row length and col length through "size"
 */
var TileEntityVM = me.ObjectEntity.extend({
    x: 0, //column
    y: 0, //row
    size: [1, 1],
    cannonTile: [0, 0], //image offset
    isSelectable: false,
    init: function(x, y, settings) {
        'use strict';
        var type, selected = false;
        this.screen = me.state.current();
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

        if (!this.selectionColor) {
            this.selectionColor = 'teal';
        }
        this.selected = function() {
            return selected;
        };
        this.select = function() {
            selected = true;
            if (!_.contains(gs.selected, this)) {
                gs.selected.push(this);
            }
            this.onSelected();
        };
        this.deselect = function() {
            selected = false;
            sh.utils.removeFromArray(this, gs.selected);
            this.onDeselected();
        };
    },
    update: function() {
        'use strict';
        this.parent();
        if (this.isSelectable && this.isMouseOver) {
            utils.setCursor('pointer');
        }
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
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        if (this.isSelectable) {
            if (this.selected()) {
                this.drawSelectedHightlight(ctx);
            } else if (this.isMouseOver) {
                this.drawHoverHighlight(ctx);
            }
        }
    },
    drawHoverHighlight: function(ctx) {
        'use strict';
        ctx.strokeStyle = this.selectionColor;
        ctx.lineWidth = 1;
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.strokeRect(this.pos.x, this.pos.y, this.width,
            this.height);
    },
    drawSelectedHightlight: function(ctx) {
        'use strict';
        ctx.strokeStyle = this.selectionColor;
        ctx.lineWidth = 2;
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.strokeRect(this.pos.x, this.pos.y, this.width,
            this.height);
    },
    onMouseDown: function() {
        'use strict';
        return '';//for jsLint
    },
    onMouseUp: function() {
        'use strict';
        if (this.isSelectable) {
            this.select();
        }
    },
    onMouseEnter: function() {
        'use strict';
        return '';//for jsLint
    },
    onMouseLeave: function() {
        'use strict';
        if (this.isSelectable) {
            utils.setCursor('default');
        }
    },
    onSelected: function() {
        'use strict';
        return '';//for jsLint
    },
    onDeselected: function() {
        'use strict';
        return '';//for jsLint
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
        if (this.wasSelectable) {
            this.isSelectable = true;
        }
        return this;
    },
    hide: function() {
        'use strict';
        this.hidden(true);
        if (this.isSelectable) {
            if (this.selected()) {
                this.deselect();
            }
            this.wasSelectable = true;
            this.isSelectable = false;
        }
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
     * Choose which properties would be tracked to
     * be stored in 'changed'.
     * @param {Array} properties
     */
    setTracked: function(properties) {
        'use strict';
        this.prevModelState = {};
        _.each(properties, function(p) {
            this.prevModelState[p] = this.m[p];
        }, this);
    },
    notifyModelChange: function() {
        'use strict';
        var self = this,
            changed = {};
        _.each(this.prevModelState, function(value, propName) {
            if (self.m[propName] !== value) {
                changed[propName] = {previous: self.prevModelState[propName]};
                //update previous model state
                self.prevModelState[propName] = self.m[propName];
            }
        });
        if (_.size(changed) > 0) {
            this.onModelChanged(changed);
        }
    },
    onModelChanged: function(changed) {
        'use strict';
        //(override this function)
        return changed;
    },
    /**
     * OnDestroy notification function<br>
     * Called by engine before deleting the object<br>
     * be sure to call the parent function if overwritten
     */
    onDestroyEvent: function() {
        'use strict';
        this.parent();
        me.input.releaseMouseEvent('mousedown', this);
        me.input.releaseMouseEvent('mouseup', this);
    }
});


/* Screen where one builds the ship */
var ShipBuildingScreen = me.ScreenObject.extend({
    iItemID: 0,
    ship: null,
    prevMouse: {},
    init: function (shipTmxName) {
        'use strict';
        var self = this;
        this.parent(true);
        this.ship = new Ship(shipTmxName);
        this.ship.onBuildingsChanged = function () {
            self.updateGreenSpots();
        };
        
    },
    onResetEvent: function () {
        'use strict';
        this.parent(true);
        me.game.reset();
        // stuff to reset on state change
        me.levelDirector.loadLevel(this.ship.tmxName);
        me.game.sort();

        me.input.bindKey(me.input.KEY.ESC, 'escape');
        me.input.registerMouseEvent('mousedown', me.game.viewport,
            this.mouseDown.bind(this));
        me.input.registerMouseEvent('mousemove', me.game.viewport,
            this.mouseMove.bind(this));
        me.input.registerMouseEvent('mouseup', me.game.viewport,
            this.mouseUp.bind(this));
        me.input.registerMouseEvent('dblclick', me.game.viewport,
            this.mouseDbClick.bind(this));
        

        /*user interface stuff*/
        this.prepareGhostItems();
        this.greenSpots = utils.getEmptyMatrix(WIDTH(), HEIGHT(), 0);

    },

    /* ---
    action to perform when game is finished (state change)
    --- */
    onDestroyEvent: function () {
        'use strict';
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('dblclick', me.game.viewport);
    },
    update: function () {
        'use strict';
        this.addAsObject = true;
        if (me.input.isKeyPressed('escape')) {
            if (this.mouseLockedOn) {
                this.mouseLockedOn.lockedEscape();
                return;
            }
            if (this.chosen) {
                this.choose();
            }
        }
    },
    mouseDbClick: function (e) {
        'use strict';
        //note: the "this" context is a canvas, not the screen
        var mouseTile, screen = me.state.current();
        mouseTile = utils.getMouse();
        if (screen.mouseLockedOn) { //the mouse is involved in a specific object
            //delegate handling to the object
            screen.mouseLockedOn.lockedMouseDbClick(mouseTile);
            return;
        }

        me.game.sort();
        me.game.repaint();
    },
    mouseDown: function (e) {
        'use strict';
        var mouseTile, item, which;
        which = e.which - 1;
        mouseTile = utils.getMouse();
        if (this.mouseLockedOn) { //the mouse is involved in a specific object
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseDown(mouseTile);
            return;
        }

        item = this.ship.mapAt(mouseTile.x, mouseTile.y);
        if (item !== null && item.name === 'item') {
            if (which === me.input.mouse.RIGHT) {
                this.ship.remove(item);
                this.updateRed();
            } else {
                this.selected = item;
                if (!this.chosen) {
                    this.beginDrag(item);
                }
            }
        }
        me.game.sort();
        me.game.repaint();
    },
    mouseMove: function () {
        'use strict';
        var mouseTile = utils.getMouse();
        if (this.prevMouse.x === mouseTile.x &&
            this.prevMouse.y === mouseTile.y) {
            return;
        }
        if (this.mouseLockedOn) { //the mouse is involved in a specific object
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseMove(mouseTile);
            return;
        }
        if (!this.chosen) {
            return;
        }
        this.moveGhost(mouseTile.x, mouseTile.y);
        me.game.sort();
        me.game.repaint();
        this.prevMouse = mouseTile;

    },
    mouseUp: function (e) {
        'use strict';
        var mouseTile, which;
        which = e.which - 1;
        mouseTile = utils.getMouse();
        if (this.mouseLockedOn) { //the mouse is involved in a specific object
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseUp(mouseTile);
            return;
        }

        if (this.chosen && !this.dragging) {
            if (which !== me.input.mouse.RIGHT) {
                this.ship.buildAt(mouseTile.x, mouseTile.y, this.chosen.type);
            }
        } else if (this.dragging) {
            this.endDrag();
        }

        me.game.sort();
        me.game.repaint();

    },

    /* User Interface Stuff*/
    chosen: null, //the chosen object from the panel (an ItemObject)
    mouseLockedOn: null, //who the mouse actions pertain to.
    ghostItems: {}, //Items that exist for the sole purpose of...
    prepareGhostItems: function () {
        var type, newItem;
        this.ghostItems = {}; //Items to be used when choosing building location
        for (type in items) {
            if (items.hasOwnProperty(type)) {
                newItem = utils.makeItem(type);
                this.ghostItems[type] = newItem;
                newItem.hide();
                me.game.add(newItem, newItem.zIndex + 1000);
                newItem.onShip(false);
            }
        }
    },

    // ...showing the position at which they will be built.
    choose: function (name) {
        if (this.chosen) {
            if (this.chosen.type === name) {
                return;
            }
            this.chosen.hide();
            this.clearRed();
            $('#item_' + this.chosen.type).removeClass('chosen');

            me.game.repaint();
        }
        this.chosen = this.ghostItems[name];
        if (!this.chosen) {
            this.chosen = null;
            return;
        }
        var mouse = utils.getMouse();
        this.chosen.x(mouse.x)
            .y(mouse.y)
            .show();
        this.updateGreenSpots();

        $('#item_' + this.chosen.type).addClass('chosen');
        me.game.sort();
        me.game.repaint();
    },
    moveGhost: function (x, y) {
        this.chosen.x(x).y(y);
        //Rotate if it fits somewhere
        if (!this.chosen.rotated() && this.chosen.canBuildRotated(x, y, this.ship)) {
            this.chosen.rotated(true);
        }
        if (this.chosen.rotated() && this.chosen.canBuildAt(x, y, this.ship)) {
            this.chosen.rotated(false);
        }
        this.updateRed();
    },
    //Dragging
    dragging: null,
    beginDrag: function (building) {
        if (this.chosen) {
            console.log('There should be nothing chosen when drag begins. ' +
                '(this.beginDrag)');
        }
        building.hide();
        this.ship.buildingsMap.update();
        this.choose(building.type);
        this.dragging = building;
    },
    endDrag: function () {
        if (!this.dragging) {
            return;
        }
        var mouse = utils.getMouse();
        if (this.dragging.canBuildAt(mouse.x, mouse.y, this.ship)) {
            this.dragging.x(mouse.x).y(mouse.y);
        }
        this.dragging.show();
        this.ship.buildingsMap.update();
        this.choose();
        this.dragging = null;
    },
    //Red overlay
    redScreen: [],
    redIndex: 0,
    printRed: function (x, y) {
        this.redScreen[this.redIndex] = new RedColorObject(x, y, {});
        me.game.add(this.redScreen[this.redIndex],
        this.redScreen[this.redIndex].zIndex + 1000);
        this.redIndex++;
    },
    clearRed: function () {
        var i = 0;
        for (i = this.redIndex; i > 0; i--) {
            me.game.remove(this.redScreen[i - 1]);
            this.redScreen.pop();
        }
        this.redIndex = 0;
    },
    updateRed: function () {
        this.clearRed();
        var self = this;
        utils.itemTiles(this.chosen, function (iX, iY) {
            if (self.greenSpots[iY][iX] === 0) {
                self.printRed(iX, iY);
            }
        });
    },
    //A matrix of 1 and 0. In 0 should be red overlay when trying to build
    greenSpots: null,
    updateGreenSpots: function () {
        var self = this;
        if (!this.chosen) {
            return;
        }
        self.greenSpots = utils.getEmptyMatrix(WIDTH(), HEIGHT(), 0);
        utils.levelTiles(function (x, y) {
            var i, j, cWidth, cHeight;
            if (self.chosen.canBuildAt(x, y, self.ship)) {
                cWidth = self.chosen.size[0];
                cHeight = self.chosen.size[1];
            }
            if (self.chosen.canBuildRotated(x, y, self.ship)) {
                cWidth = self.chosen.size[1];
                cHeight = self.chosen.size[0];
            }
            for (i = x; i < cWidth + x && i < WIDTH(); i++) {
                for (j = y; j < cHeight + y && j < HEIGHT(); j++) {
                    self.greenSpots[j][i] = 1;
                }
            }
        });
    },
    drawingScreen: [],
    //draws arbitrary stuff
    drawItem: function (x, y, type) {
        var item = utils.makeItem(type).x(x).y(y);
        me.game.add(item, item.zIndex + 1000);
        this.drawingScreen.push(item);
        me.game.sort();
        me.game.repaint();

    },
    clear: function () {
        _.each(this.drawingScreen, function (i) {
            me.game.remove(i, true);
        });
        this.drawingScreen = [];
        this.clearRed();

        me.game.sort();
        me.game.repaint();
    },

    //combines the ship map with the drawing screen
    mapAt: function (x, y) {
        var i, shipTile = null;
        for (i = 0; i < this.drawingScreen.length; i++) {
            if (this.drawingScreen[i].occupies(x, y)) {
                return this.drawingScreen[i];
            }
        }
        if (this.ship.map()[y] !== undefined && this.ship.map()[y][x] !== undefined) {
            shipTile = this.ship.map()[y][x];
        }
        if (shipTile === charMap.codes._cleared && this.chosen &&
            this.chosen.occupies(x, y)) {
            return this.chosen;
        }
        return shipTile;
    }

});
/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/


/*global
_, html, $, Ship, me, utils, jsApp, width, height, AjaxUpload,
items, RedColorEntity, charMap */

/* Screen where one builds the ship */
var ShipBuildingScreen = me.ScreenObject.extend({
    name: 'ship-building-screen',
    isReset: false,
    ship: null,
    prevMouse: {},
    width: 0,
    height: 0,
    init: function() {
        'use strict';
        this.parent(true);
    },
    /**
     *
     * @param {Object} settings has tmxName or jsonData.
     */
    onResetEvent: function(settings) {
        'use strict';
        var self = this;
        this.parent(true);

        me.video.clearSurface(me.video.getScreenContext(), 'black');
        // stuff to reset on state change
        this.ship = new Ship(settings, true);
        this.ship.showInScreen();
        this.ship.onBuildingsChanged = function() {
            self.updateGreenSpots();
        };
        this.width = me.game.currentLevel.width;
        this.height = me.game.currentLevel.height;

        me.game.sort();

        //Debugging commands
        me.input.bindKey(me.input.KEY.L, 'load');//load
        me.input.bindKey(me.input.KEY.S, 'save');//save

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
        html.load('ship-building-screen');
        this.onHtmlLoaded();

        this.mouseLockedOn = null;
        this.prepareGhostItems();
        this.greenSpots = utils.getEmptyMatrix(width(), height(), 0);

        this.isReset = true;
        jsApp.onScreenReset();
    },

    /* ---
    action to perform when game is finished (state change)
    --- */
    onDestroyEvent: function() {
        'use strict';
        me.input.unbindKey(me.input.KEY.ESC);
        me.input.releaseMouseEvent('mousedown', me.game.viewport);
        me.input.releaseMouseEvent('mousemove', me.game.viewport);
        me.input.releaseMouseEvent('mouseup', me.game.viewport);
        me.input.releaseMouseEvent('dblclick', me.game.viewport);
        html.clear();
        this.isReset = false;
    },
    update: function() {
        'use strict';
        if (me.input.isKeyPressed('escape')) {
            if (this.mouseLockedOn) {
                this.mouseLockedOn.lockedEscape();
                return;
            }
            if (this.chosen) {
                this.choose();
            }
        }

        //TODO: remove this and the bindings
        if (me.input.isKeyPressed('save')) {
            console.log(this.ship.toJsonString());
        }
        if (me.input.isKeyPressed('load')) {
            var data = window.prompt('enter ship json data');
            me.state.change(me.state.BUILD, {jsonString: data});
        }

        _.each(this.drawingScreen, function(item){
            item.update();
        });
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        _.each(this.drawingScreen, function(item){
            item.draw(ctx);
        });
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this,
            loadingNextScreen = false;
        $('.items').click(function() {
            var idItem, itemName;
            if (me.state.isCurrent(me.state.LOADING)) {
                return;
            }
            idItem = $('img', this).attr('id');
            itemName = idItem.substring(5, idItem.length);
            me.state.current().choose(itemName);
        });


        //Save
        $('#file_save').click(function() {
            var shipData = screen.ship.toJsonString(),
                name = prompt('Enter the ship name.');
            $.post('/save', {name: name, buildings: shipData},
                function(response) {
                if (response) {
                    alert('saved');
                }
                else {
                    alert('Error: Could not save ship.');
                }
            },'json');
        });
        //Load
        $('#file_load').click(function() {
            var name = prompt('Enter the ship name you wish to load.');
            $.post('/load', {name: name},function(response) {
                if (response) {
                    me.state.change(me.state.BUILD, {jsonString: response});
                }else {
                    alert('Error: Could not load ship.');
                }
            },'json');
        });

        $('.battle-button').click(function() {
            if (!loadingNextScreen) {
                screen.finishShip();
                loadingNextScreen = true;
            }

        });
    },
    finishShip: function(){
        //put the ship in global context

        me.game.ship = this.ship;
        //TODO: since units are configured, battle screen start up time has
        //todo: been slower
        me.game.ship.putUnit({imgRow: 0, speed: 0.5});
        me.game.ship.putUnit({imgRow: 6, speed: 1});
        me.game.ship.putUnit({imgRow: 7, speed: 2});
        me.game.ship.putUnit({imgRow: 12, speed: 3});

        console.log('Creating battle...');
        $.post('/battles/create',{shipJsonString: me.game.ship.toJsonString()},
                    function(data) {
            console.log('Battle created');
            me.state.change(me.state.BATTLE, {battleID: data.battleID});
        }, 'json');

    },
    mouseDbClick: function(e) {
        'use strict';
        //note: the "this" context is a canvas, not the screen
        var mouseTile, screen = me.state.current();
        mouseTile = utils.getMouse();
        if (screen.mouseLockedOn) { //the mouse is involved in a specific obj
            //delegate handling to the object
            screen.mouseLockedOn.lockedMouseDbClick(mouseTile);
            return;
        }

        me.game.sort();
        me.game.repaint();
    },
    mouseDown: function(e) {
        'use strict';
        var mouseTile, item, which;
        which = e.which - 1; //workaround for melonJS mismatch
        mouseTile = utils.getMouse();
        if (this.mouseLockedOn) { //the mouse is involved in a specific obj
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
    mouseMove: function() {
        'use strict';
        var mouseTile = utils.getMouse();
        if (this.prevMouse.x === mouseTile.x &&
            this.prevMouse.y === mouseTile.y) {
            return;
        }
        if (this.mouseLockedOn) { //the mouse is involved in a specific obj
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
    mouseUp: function(e) {
        'use strict';
        var mouseTile, which;
        which = e.which - 1; //workaround for melonJS mismatch
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
    chosen: null, //the chosen object from the panel (an ItemEntity)
    mouseLockedOn: null, //who the mouse actions pertain to.
    ghostItems: {}, //Items that exist for the sole purpose of...
    prepareGhostItems: function() {
        'use strict';
        var type, newItem;
        this.ghostItems = {};//Items to be used when choosing building location
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
    choose: function(name) {
        'use strict';
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
    moveGhost: function(x, y) {
        'use strict';
        this.chosen.x(x).y(y);
        //Rotate if it fits somewhere
        if (!this.chosen.rotated() &&
                this.chosen.canBuildRotated(x, y, this.ship)) {
            this.chosen.rotated(true);
        }
        if (this.chosen.rotated() && this.chosen.canBuildAt(x, y, this.ship)) {
            this.chosen.rotated(false);
        }
        this.updateRed();
    },
    //Dragging
    dragging: null,
    beginDrag: function(building) {
        'use strict';
        if (this.chosen) {
            console.log('There should be nothing chosen when drag begins. ' +
                '(this.beginDrag)');
        }
        building.hide();
        this.ship.buildingsMap.update();
        this.choose(building.type);
        this.dragging = building;
    },
    endDrag: function() {
        'use strict';
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
    printRed: function(x, y) {
        'use strict';
        this.redScreen[this.redIndex] = new RedColorEntity(x, y, {});
        me.game.add(this.redScreen[this.redIndex],
        this.redScreen[this.redIndex].zIndex + 1000);
        this.redIndex++;
    },
    clearRed: function() {
        'use strict';
        var i = 0;
        for (i = this.redIndex; i > 0; i--) {
            me.game.remove(this.redScreen[i - 1]);
            this.redScreen.pop();
        }
        this.redIndex = 0;
    },
    updateRed: function() {
        'use strict';
        this.clearRed();
        var self = this;
        utils.itemTiles(this.chosen, function(iX, iY) {
            if (self.greenSpots[iY][iX] === 0) {
                self.printRed(iX, iY);
            }
        }, me.game.currentLevel);
    },
    //A matrix of 1 and 0. In 0 should be red overlay when trying to build
    greenSpots: null,
    updateGreenSpots: function() {
        'use strict';
        var self = this;
        if (!this.chosen) {
            return;
        }
        self.greenSpots = utils.getEmptyMatrix(width(), height(), 0);
        utils.levelTiles(function(x, y) {
            var i, j, cWidth, cHeight;
            if (self.chosen.canBuildAt(x, y, self.ship)) {
                cWidth = self.chosen.size[0];
                cHeight = self.chosen.size[1];
            }
            if (self.chosen.canBuildRotated(x, y, self.ship)) {
                cWidth = self.chosen.size[1];
                cHeight = self.chosen.size[0];
            }
            for (i = x; i < cWidth + x && i < width(); i++) {
                for (j = y; j < cHeight + y && j < height(); j++) {
                    self.greenSpots[j][i] = 1;
                }
            }
        });
    },
    drawingScreen: [],
    //draws arbitrary stuff
    drawItem: function(x, y, type) {
        'use strict';
        var item = utils.makeItem(type).x(x).y(y);
        this.drawingScreen.push(item);
        me.game.repaint();
    },
    clear: function() {
        'use strict';
        this.drawingScreen = [];
        this.clearRed();
        me.game.repaint();
    },

    //combines the ship map with the drawing screen
    mapAt: function(x, y) {
        'use strict';
        var i, shipTile = null;
        for (i = 0; i < this.drawingScreen.length; i++) {
            if (this.drawingScreen[i].occupies(x, y)) {
                return this.drawingScreen[i];
            }
        }
        if (this.ship.map()[y] !== undefined &&
            this.ship.map()[y][x] !== undefined) {
            shipTile = this.ship.map()[y][x];
        }
        if (shipTile === charMap.codes._cleared && this.chosen &&
            this.chosen.occupies(x, y)) {
            return this.chosen;
        }
        return shipTile;
    }
});


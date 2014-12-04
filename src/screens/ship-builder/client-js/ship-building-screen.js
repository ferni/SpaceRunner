/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/


/*global require, module, $, me, _*/
var sh = require('../../_common/shared-js'),
    ShipVM = require('./ship-vm'),
    utils = require('../../_common/client-js/global-helpers/utils'),
    itemVMs = require('../../_common/client-js/item-vms').itemVMs,
    ui = require('../../_common/client-js/ui');

/* Screen where one builds the ship */
module.exports = me.ScreenObject.extend({
    ship: null,
    prevMouse: {},
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
        // stuff to reset on state change
        this.ship = new sh.Ship(settings, true);
        this.shipVM = new ShipVM(this.ship);
        this.shipVM.showInScreen();
        this.ship.onBuildingsChanged = function() {
            self.updateGreenSpots();
        };

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

        this.mouseLockedOn = null;
        this.prepareGhostItems();
        this.greenSpots = sh.utils.getEmptyMatrix(this.ship.width,
            this.ship.height, 1);
        this.onHtmlLoaded();
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
    },
    update: function() {
        'use strict';
        this.shipVM.update();
        if (me.input.isKeyPressed('escape')) {
            if (this.mouseLockedOn) {
                this.mouseLockedOn.lockedEscape();
                return;
            }
            if (this.chosen) {
                this.choose();
            }
        }
        _.each(this.drawingScreen, function(item) {
            item.update();
        });
    },


    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        _.each(this.drawingScreen, function(item) {
            item.draw(ctx);
        });
    },
    onHtmlLoaded: function() {
        'use strict';
        var screen = this,
            loadingNextScreen = false;
        $('.item').click(function() {
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
            var shipData = screen.ship.toJson(),
                name = prompt('Enter the ship name.');
            $.post('/save', {name: name, buildings: shipData},
                function(response) {
                    if (response) {
                        alert('saved');
                    } else {
                        alert('Error: Could not save ship.');
                    }
                }, 'json');
        });
        //Load
        $('#file_load').click(function() {
            var name = prompt('Enter the ship name you wish to load.');
            $.post('/load', {name: name}, function(response) {
                if (response) {
                    me.state.change('ship-building', {json: response});
                } else {
                    alert('Error: Could not load ship.');
                }
            }, 'json');
        });
        $('#jsapp').find('canvas').css({width: '', height: ''});
    },
    mouseDbClick: function() {
        'use strict';
        //note: the "this" context is a canvas, not the screen
        var mouseTile, screen = me.state.current();
        mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
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
        mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (this.mouseLockedOn) { //the mouse is involved in a specific obj
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseDown(mouseTile);
            return;
        }

        item = this.ship.at(mouseTile.x, mouseTile.y);
        if (item !== null && item instanceof sh.Item) {
            if (which === me.input.mouse.RIGHT) {
                this.deleteItem(item);
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
        var mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        if ((this.prevMouse.x === mouseTile.x &&
                this.prevMouse.y === mouseTile.y)) {
            return;
        }
        this.prevMouse.x = mouseTile.x;
        this.prevMouse.y = mouseTile.y;
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (this.mouseLockedOn) { //the mouse is involved in a specific obj
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseMove(mouseTile);
            if (this.mouseLockedOn.type === 'Wall' ||
                    this.mouseLockedOn.type === 'Door') {
                this.updateWalls();
            }
            return;
        }
        if (!this.chosen) {
            return;
        }
        this.moveGhost(mouseTile.x, mouseTile.y);

        if (this.chosen.type === 'Wall' ||
                this.chosen.type === 'Door') {
            this.updateWalls();
        }
        me.game.sort();
        me.game.repaint();
    },
    mouseUp: function(e) {
        'use strict';
        var mouseTile, which;
        which = e.which - 1; //workaround for melonJS mismatch
        mouseTile = utils.toTileVector(utils.getMousePx(), 32);
        mouseTile = sh.v.mul(mouseTile, sh.GRID_SUB);
        if (this.mouseLockedOn) { //the mouse is involved in a specific object
            //delegate handling to the object
            this.mouseLockedOn.lockedMouseUp(mouseTile);
            me.game.sort();
            me.game.repaint();
            return;
        }

        if (this.chosen && !this.dragging) {
            if (which === me.input.mouse.LEFT) {
                this.buildItem(mouseTile.x, mouseTile.y, this.chosen.type);
                if (this.chosen.type === 'Door' ||
                        this.chosen.type === 'Wall') {
                    this.updateWalls();
                }
            }
        } else if (this.dragging) {
            this.endDrag(mouseTile);
        }

        me.game.sort();
        me.game.repaint();

    },
    updateWalls: function() {
        'use strict';
        var items = _.union(me.game.getEntityByName('item'),
            this.drawingScreen);
        _.invoke(_.where(items, {type: 'Wall'}), 'updateAnimation');
    },
    buildItem: function(x, y, type) {
        'use strict';
        var built = this.ship.buildAt(x, y, type);
        if (built) {
            this.shipVM.update();
            this.shipVM.getVM(built).onBuilt();
        }
    },
    deleteItem: function(item) {
        'use strict';
        this.ship.remove(item, true);
        this.updateRed();
    },
    makeItem: function(type, settings) {
        'use strict';
        var Constructor, model;
        model = new sh.items[type](settings);
        Constructor = itemVMs[type];
        return new Constructor(model);
    },
    /* User Interface Stuff*/
    chosen: null, //the chosen object from the panel (an Item)
    mouseLockedOn: null, //who the mouse actions pertain to.
    ghostItems: {}, //Items that exist for the sole purpose of...
    prepareGhostItems: function() {
        'use strict';
        var type, newItem;
        this.ghostItems = {};//Items to be used when choosing building location
        for (type in itemVMs) {
            if (itemVMs.hasOwnProperty(type)) {
                newItem = this.makeItem(type, {x: 0, y: 0});
                this.ghostItems[type] = newItem;
                newItem.hide();
                me.game.add(newItem, ui.layers.indicators);
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
        this.chosen
            .setX(mouse.x)
            .setY(mouse.y)
            .show().alpha = 0.8;
        this.updateGreenSpots();

        $('#item_' + this.chosen.type).addClass('chosen');
        me.game.sort();
        me.game.repaint();
    },
    moveGhost: function(x, y) {
        'use strict';
        this.chosen.setX(x).setY(y);
        //Rotate if it fits somewhere
        if (!this.chosen.rotated() &&
                this.chosen.m.canBuildRotated(x, y, this.ship)) {
            this.chosen.rotated(true);
        }
        if (this.chosen.rotated() &&
                this.chosen.m.canBuildAt(x, y, this.ship)) {
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
        this.ship.remove(building, true);
        this.choose(building.type);
        this.dragging = building;
    },
    endDrag: function(mouse) {
        'use strict';
        if (!this.dragging) {
            return;
        }
        if (this.dragging.canBuildAt(mouse.x, mouse.y, this.ship)) {
            this.dragging.x = mouse.x;
            this.dragging.y = mouse.y;
        }
        this.ship.addItem(this.dragging);
        this.choose();
        this.dragging = null;
        this.shipVM.update();
    },
    //Red overlay
    redScreen: [],
    redIndex: 0,
    printRed: function(x, y) {
        'use strict';
        this.redScreen[this.redIndex] = new ui.RedColorEntity(x, y, {});
        me.game.add(this.redScreen[this.redIndex], ui.layers.colorOverlay);
        this.redIndex++;
    },
    clearRed: function() {
        'use strict';
        var i;
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
        if (this.chosen) {
            this.chosen.tiles(function(iX, iY) {
                if (self.greenSpots[iY][iX] === 1) {
                    self.printRed(iX, iY);
                }
            }, self.ship);
        }
    },
    //A matrix of 1 and 0. In 1 should be red overlay when trying to build
    greenSpots: null,
    updateGreenSpots: function() {
        'use strict';
        var self = this,
            ship = this.ship;
        if (!this.chosen) {
            return;
        }
        self.greenSpots = sh.utils.getEmptyMatrix(ship.width, ship.height, 1);
        ship.map.tiles(function(x, y) {
            var i, j, cWidth, cHeight;
            if (self.chosen.m.canBuildAt(x, y, ship)) {
                cWidth = self.chosen.size[0];
                cHeight = self.chosen.size[1];
            }
            if (self.chosen.m.canBuildRotated(x, y, ship)) {
                cWidth = self.chosen.size[1];
                cHeight = self.chosen.size[0];
            }
            for (i = x; i < cWidth + x && i < ship.width; i++) {
                for (j = y; j < cHeight + y && j < ship.height; j++) {
                    self.greenSpots[j][i] = 0;
                }
            }
        });
    },
    drawingScreen: [],
    //draws arbitrary stuff
    drawItem: function(x, y, type) {
        'use strict';
        var item = this.makeItem(type, {x: x, y: y});
        item.alpha = 0.8;
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
    at: function(x, y) {
        'use strict';
        var i, shipTile;
        for (i = 0; i < this.drawingScreen.length; i++) {
            if (this.drawingScreen[i].occupies({x: x, y: y})) {
                return this.drawingScreen[i];
            }
        }
        shipTile = this.ship.map.at(x, y);
        if (shipTile === sh.tiles.clear && this.chosen &&
                this.chosen.occupies({x: x, y: y})) {
            return this.chosen;
        }
        return shipTile;
    }
});



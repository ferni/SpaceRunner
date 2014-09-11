/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, make, _, sh, utils, ui, ko*/

/**
 * An object in charge of representing a sh.Ship on the screen.
 * @param {sh.Ship} shipModel the ship model.
 * @constructor
 */
var ShipVM = function(shipModel) {
    'use strict';
    this.itemVMs = [];
    this.unitVMs = [];

    this.m = shipModel;
    this.showInScreen = function() {
        me.levelDirector.loadLevel(this.m.tmxName);
    };
    /**
     * Updates melonJS objects for items to be drawn on the screen
     * according to the ship model.
     * @return {bool}
     * @this {ShipVM}
     */
    this.update = function() {
        var somethingChanged = false;
        if (this.updateItems()) {
            somethingChanged = true;
        }
        if (this.updateUnits()) {
            somethingChanged = true;
        }
        if (somethingChanged) {
            me.game.sort();
        }
        return somethingChanged;
    };
    this.updateItems = function() {
        return utils.updateVMs(this.m.built, this.itemVMs, ui.layers.items);
    };
    this.updateUnits = function() {
        return utils.updateVMs(this.m.units, this.unitVMs, ui.layers.units);
    };
    this.draw = function(ctx) {
        return ctx;
    };
    this.selected = function() {
        return _.filter(this.unitVMs, function(u) {
            return u.selected();
        });
    };

    this.getVM = function(model) {
        if (model instanceof sh.Item) {
            return utils.getVM(model, this.m.built, this.itemVMs);
        }
        if (model instanceof sh.Unit) {
            return utils.getVM(model, this.m.units, this.unitVMs);
        }
        throw 'Invalid type of model.';
    };

    this.getUnitVMByID = function(id) {
        id = parseInt(id, 10);
        return _.find(this.unitVMs, function(uVM) {
            return uVM.m.id === id;
        });
    };
};

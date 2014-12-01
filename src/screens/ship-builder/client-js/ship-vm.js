/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, me, _, utils, ui, ko, ItemVM, itemVMs, UnitVM, unitVMs*/

/**
 * An object in charge of representing a sh.Ship on the screen.
 * @param {sh.Ship} shipModel the ship model.
 * @constructor
 */
var ShipVM = module.exports = function(shipModel) {
    'use strict';
    this.itemVMs = [];

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
        if (somethingChanged) {
            me.game.sort();
        }
        return somethingChanged;
    };
    this.updateItems = function() {
        return utils.updateVMs({
            models: this.m.built,
            vms: this.itemVMs,
            zIndex: ui.layers.items,
            DefaultConstructor: ItemVM,
            vmConstructors: itemVMs
        });
    };
    this.draw = function(ctx) {
        return ctx;
    };

    this.getVM = function(item) {
        return utils.getVM(item, this.m.built, this.itemVMs);
    };
};

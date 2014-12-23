/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me*/

var _ = require('underscore')._,
    sh = require('shared'),
    utils = require('client/utils'),
    ui = require('client/ui'),
    ItemVM = require('client/item-vms').ItemVM,
    itemVMs = require('client/item-vms').itemVMs,
    UnitVM = require('./unit-vms').UnitVM,
    unitVMs = require('./unit-vms').unitVMs;

/**
 * An object in charge of representing a sh.Ship on the screen.
 * @param {sh.Ship} shipModel the ship model.
 * @constructor
 */
module.exports = function(shipModel) {
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
        return utils.updateVMs({
            models: this.m.built,
            vms: this.itemVMs,
            zIndex: ui.layers.items,
            DefaultConstructor: ItemVM,
            vmConstructors: itemVMs
        });
    };
    this.updateUnits = function() {
        return utils.updateVMs({
            models: this.m.units,
            vms: this.unitVMs,
            zIndex: ui.layers.units,
            DefaultConstructor: UnitVM,
            vmConstructors: unitVMs
        });
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

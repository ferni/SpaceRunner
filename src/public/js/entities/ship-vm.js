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
    this.hp = ko.observable(shipModel.hp);
    this.enemyHP = ko.observable(shipModel.enemyHP);
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
        if (this.prevHP !== this.m.hp) {
            this.hp(this.m.hp);
        }
        if (this.prevEnemyHP !== this.m.enemyHP) {
            this.enemyHP(this.m.enemyHP);
        }
        this.prevHP = this.m.hp;
        this.prevEnemyHP = this.m.enemyHP;
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

    //internal function used by getVM
    function getMatch(model, modelArray, vmArray) {
        var index = modelArray.indexOf(model);
        if (index !== null && index !== undefined &&
                vmArray[index].m === model) {
            return vmArray[index];
        }
        throw 'Did not find view model, try calling update first.';
    }

    this.getVM = function(model) {
        if (model instanceof sh.Item) {
            return getMatch(model, this.m.built, this.itemVMs);
        }
        if (model instanceof sh.Unit) {
            return getMatch(model, this.m.units, this.unitVMs);
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

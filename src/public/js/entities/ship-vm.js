/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, make, _, sh*/

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
        return this.updateVMs(this.m.built, this.itemVMs, 100);
    };
    this.updateUnits = function() {
        return this.updateVMs(this.m.units, this.unitVMs, 200);
    };
    this.updateVMs = function(models, vms, zIndex) {
        var i, v, hasVM, aux, somethingChanged = false;
        for (i = 0; i < models.length; i++) {
            hasVM = false;
            for (v = i; v < vms.length; v++) {
                if (models[i] === vms[v].m) {
                    hasVM = true;
                    break;
                }
            }
            if (hasVM) {
                //put vm at item's index position
                if (v !== i) {
                    aux = vms[v];
                    vms[v] = vms[i];
                    vms[i] = aux;
                }
            } else {
                //new vm
                vms.splice(i, 0, make.vm(models[i]));
                me.game.add(vms[i], zIndex);
                somethingChanged = true;
            }
        }
        //remove extra vms
        for (v = models.length; v < vms.length; v++) {
            me.game.remove(vms[v], true);
            somethingChanged = true;
        }
        vms.splice(models.length, vms.length - models.length);
        return somethingChanged;
    };
    this.draw = function(ctx) {
        return ctx;
    };
    this.selected = function() {
        return _.filter(this.unitVMs, function(u) {
            return u.selected;
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
};

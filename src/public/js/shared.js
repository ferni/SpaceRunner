/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

/*
Shared code between server and client

 */

(function(exports){
    var _,
        ExtendableShared;

    if (exports.onClient) {
        _ = window._;
    } else {
        _ = require('underscore')._;
    }
    /**
     * JavaScript Inheritance Helper
     * (the same as in melonJS)
     * */
     ExtendableShared = function(){};
     ExtendableShared.extendShared = function(prop) {
            // _super rename to parent to ease code reading
            var parent = this.prototype,
                fnTest = /xyz/.test(function() {xyz;}) ? /\bparent\b/ : /.*/;

            // Instantiate a base class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var proto = new this();
            initializing = false;

            // Copy the properties over onto the new prototype
            for ( var name in prop) {
                // Check if we're overwriting an existing function
                proto[name] = typeof prop[name] == "function"
                    && typeof parent[name] == "function"
                    && fnTest.test(prop[name]) ? (function(name, fn) {
                    return function() {
                        var tmp = this.parent;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this.parent = parent[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this.parent = tmp;

                        return ret;
                    };
                })(name, prop[name]) : prop[name];
            }

            // The dummy class constructor
            function Class() {
                if (!initializing && this.init) {
                    this.init.apply(this, arguments);
                }
                //return this;
            }
            // Populate our constructed prototype object
            Class.prototype = proto;
            // Enforce the constructor to be what we expect
            Class.constructor = Class;
            // And make this class extendable
            Class.extendShared = ExtendableShared.extendShared;//arguments.callee;
            Class.extend = function(){
                throw new Error('"extendShared" should be called instead of "extend"' +
                    ' on a shared entity.');
            };
            return Class;
    };


    //SHARED ENTITIES
    exports.TestSharedEntity = ExtendableShared.extendShared({});

    exports.colMapCodes = {

    }


    //should have access to the ship
    exports.verifyOrder = function(order, ship){
        switch(order.type) {
            case 'move' : {
                var dest = order.data.destination;
                //is destination a walkable area

            }
        }
    };
    exports.setUnitPath= function(unit, mouse) {
        'use strict';

        //TODO: convert to shared function (this function was directly copied from public)

        var grid, path,
            ship = me.game.ship;
        if (mouse.x === unit.x() && mouse.y === unit.y()) {
            unit.path = [];
        } else {
            grid = new PF.Grid(ship.width, ship.height,
                ship.getPfMatrix());
            grid = this.processGrid(grid, unit, mouse);
            path = this.pfFinder.findPath(unit.x(), unit.y(),
                mouse.x, mouse.y, grid);
            console.log('path length: ' + (path.length - 1));
            if(path.length > 1) {
                unit.path = path;
            }
        }
    };
    exports.resolveOrders = function(orders) {
        var script;
        _.each(orders, function(unitOrders){
            //a set of orders for each unit
            var unitScript = {
                unitID : unitOrders.unitID,
                actions: []
            };
            _.each(unitOrders, function(order){
                switch(order.type) {
                    case 'move': {

                    }
                }
            });
        });
    }



}(typeof exports === 'undefined' ? window.shared = {
        onClient: true
    } : exports));

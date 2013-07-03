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
        ExtendableShared,
        packables = [];

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
    exports.Player = ExtendableShared.extendShared({
        init: function(settings) {
            this.settings = settings;
            this.id = settings.id;
            this.name = settings.name;
        },
        toJson: function(){
            var json = this.settings;
            json.type = 'Player';
            return json;
        }
    });
    packables.push('Player');

    /**
     * Prepares an entity to be sent over the wire.
     * @param packable
     * @returns {*}
     */
    exports.pack = function(packable){
        var json;
        if (typeof packable.toJson === 'undefined') {
            throw 'packable should implement toJson';
        }
        json = packable.toJson();
        if (typeof json.type === 'undefined') {
            throw 'packable.toJson() should contain "type" property';
        }
        if (!_.contains(packables, json.type)) {
            throw 'type "'+json.type+'" not registered in packables array';
        }
        return json;
    };

    /**
     * Reconstructs an entity packed with shared.pack()
     * @param json
     * @returns {Constructor}
     */
    exports.unpack = function(json) {
        var Constructor;
        if (!_.contains(packables, json.type)) {
            throw 'type "'+json.type+'" not registered in packables array';
        }
        Constructor = exports[json.type];
        return new Constructor(json);
    };

    exports.tiles = {
        solid: 's',
        front: 'f',
        back: 'b',
        clear: '.'
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
            ship = gameState.ship;
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
    };

    exports.mapNames = [
        'cyborg_battleship1',
        'cyborg_cruiser',
        'cyborg_drone',
        'cyborg_frigate',
        'humanoid_battleship',
        'humanoid_cruiser',
        'humanoid_drone',
        'humanoid_frigate',
        'liquid_battleship',
        'liquid_cruiser',
        'liquid_drone',
        'liquid_frigate',
        'mechanoid_battleship',
        'mechanoid_cruiser',
        'mechanoid_drone',
        'mechanoid_frigate'
    ];



}(typeof exports === 'undefined' ? window.shared = {
        onClient: true
    } : exports));

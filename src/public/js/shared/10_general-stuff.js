/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports */

var sh = require('./09_shared-class'), _ = sh._,
    PF = sh.PF;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

(function(sh) {
    'use strict';
    //SHARED ENTITIES
    sh.TestSharedEntity = sh.SharedClass.extendShared({});

    sh.Jsonable = sh.SharedClass.extendShared({
        _properties: [],
        /**
         * Sets the properties found in the json param to the object.
         * This properties are later used by toJson to return the json form
         * of the object.
         * @param {Array} properties An array of properties to be set and
         * returned in toJson.
         * @param {Object} json The json object.
         */
        set: function(properties, json) {
            this._properties = this._properties.concat(properties);
            _.each(properties, function(p) {
                this[p] = json[p];
            }, this);
        },
        toJson: function() {
            var json = {};
            _.each(this._properties, function(p) {
                json[p] = this[p];
            }, this);
            json.type = this.type;
            return json;
        }
    });

    sh.Player = sh.SharedClass.extendShared({
        init: function(settings) {
            this.type = 'Player';
            this.id = settings.id;
            this.name = settings.name;
        },
        toJson: function() {
            return {
                type: this.type,
                id: this.id,
                name: this.name
            };
        }
    });

    sh.tiles = {
        solid: 's',
        front: 'f',
        back: 'b',
        clear: '.'
    };

    sh.mapNames = [
        'test',
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

    //Object holding references to functions that will be tested.
    sh.forTesting = {};

    //used in testing
    sh.getProperties = function(object) {
        var props = [], p;
        for (p in object) {
            if (object.hasOwnProperty(p)) {
                props.push(p);
            }
        }
        return props;
    };
}(sh));


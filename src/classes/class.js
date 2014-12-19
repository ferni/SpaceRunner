/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, xyz*/


var initializing = false, //for SharedClass
    fnTest = /xyz/.test(function() {xyz;}) ? /\bparent\b/ : /.*/;

/**
 * JavaScript Inheritance Helper
 * (the same as in melonJS)
 * */
var Class = function() {
    'use strict';
};

/**
 * JavaScript Inheritance Helper <br>
 * Based on <a href="http://ejohn.org/">John Resig</a> Simple Inheritance<br>
 * MIT Licensed.<br>
 * Inspired by <a href="http://code.google.com/p/base2/">base2</a> and
 * <a href="http://www.prototypejs.org/">Prototype</a><br>
 * @param {Object} prop Object (or Properties) to inherit from
 * @return {Class}
 * @constructor
 *
 * var Person = Object.extend(
 * {
 *    init: function(isDancing)
 *    {
 *       this.dancing = isDancing;
 *    },
 *    dance: function()
 *    {
 *       return this.dancing;
 *    }
 * });
 *
 * var Ninja = Person.extend(
 * {
 *    init: function()
 *    {
 *       this.parent( false );
 *    },
 *
 *    dance: function()
 *    {
 *       // Call the inherited version of dance()
 *       return this.parent();
 *    },
 *
 *    swingSword: function()
 *    {
 *       return true;
 *    }
 * });
 *
 * var p = new Person(true);
 * p.dance(); // => true
 *
 * var n = new Ninja();
 * n.dance(); // => false
 * n.swingSword(); // => true
 *
 * // Should all be true
 * p instanceof Person && p instanceof Class &&
 * n instanceof Ninja && n instanceof Person && n instanceof Class
 */
Class.extend = function(prop) {
    'use strict';
    // _super rename to parent to ease code reading
    var parent = this.prototype,
        proto,
        name;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    proto = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (name in prop) {
        // Check if we're overwriting an existing function
        proto[name] = typeof prop[name] === 'function' &&
            typeof parent[name] === 'function' &&
            fnTest.test(prop[name]) ? (function(name, fn) {
                return function() {
                    var tmp = this.parent,
                        ret;
                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this.parent = parent[name];

                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    ret = fn.apply(this, arguments);
                    this.parent = tmp;

                    return ret;
                };
            }(name, prop[name])) : prop[name];
    }

    // The dummy class constructor
    function ClassDummy() {
        if (!initializing && this.init) {
            this.init.apply(this, arguments);
        }
        //return this;
    }
    // Populate our constructed prototype object
    ClassDummy.prototype = proto;
    // Enforce the constructor to be what we expect
    ClassDummy.constructor = ClassDummy;
    // And make this class extendable
    ClassDummy.extend = Class.extend;//arguments.callee;
    ClassDummy.extendShared = function() {
        throw new Error('"extendShared" is only for shared entities,' +
            ' use "extend" instead.');
    };
    return ClassDummy;
};

/**
 * NodeJS exports.
 * @type {Function}
 */
module.exports = Class;

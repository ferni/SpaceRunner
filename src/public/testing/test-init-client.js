/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global QUnit*/

/**
 * From QUnit documentation http://api.qunitjs.com/QUnit.config/
 *
 * Specify a global timeout in milliseconds after which all tests will fail
 * with an appropiate message. Useful when async tests aren't finishing,
 * to prevent the testrunner getting stuck.
 * @type {number}
 */
QUnit.config.testTimeout = 4000;

QUnit.done(function() {
    'use strict';
    return 0;
});

/*Hard coded hullMaps in the absence of MelonJS*/
var hullMaps = {
    'test': {
        'width': 15,
        'height': 10,
        'map': [
            'sssssssssssssss',
            'ssb...fssssssss',
            'ssb....fsssssss',
            'sss.......fssss',
            'sb...........fs',
            'sb...........fs',
            'sss.......fssss',
            'ssb....fsssssss',
            'ssb...fssssssss',
            'sssssssssssssss']
    }
};

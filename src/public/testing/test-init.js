/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global QUnit, th, $, registerTestsRequiringNodeJS, _, test*/

/**
*Autostart config
*/
QUnit.config.autostart = false;

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

th.onGameReady(function() {
    'use strict';
    var onNodeJS = false;
    $.post('general/ping', function(data) {
        if (data.ok) {
            onNodeJS = true;
        }
    }, 'json')
        .always(function() {
            if (onNodeJS) {
                //nodejs is running
                registerTestsRequiringNodeJS();
            }
            QUnit.start();
        });
});

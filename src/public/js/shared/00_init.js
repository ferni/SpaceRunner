/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global _, PF, require, exports*/


var sh;
if (typeof exports === 'undefined') {
    /**
     * The shared namespace.
     * @type {Object}
     */
    sh = window.sh = {onClient: {}};
} else {
    sh = exports;
}

(function(sh) {
    'use strict';
    if (sh.onClient) {
        sh.onClient.files = [];
        /**
         * Define a require function on the client to
         * check that the scripts are put in the correct
         * order in the head tag.
         * @param {String} file
         * @return {*}
         */
        window.require = function(file) {
            var prevFile = sh.onClient.files[sh.onClient.files.length - 1],
                files = sh.onClient.files,
                filesStr = '',
                i;
            file = file.replace(/\./gi, '');
            if (files.length > 0 && prevFile >= file) {
                for (i = 0; i < files.length; i++) {
                    filesStr += files[i];
                    if (i < files.length - 1) {
                        filesStr += ' -> ';
                    }
                }
                console.error('The shared files are not loaded' +
                    ' in alphabetical order: ' + filesStr);
            }
            files.push(file);
            return sh;
        };
        sh._ = _;
        sh.PF = PF;
    } else {
        //so they would have the same properties server and client
        sh.onClient = false;
        sh._ = require('underscore');
        sh.PF = require('pathfinding');
    }

}(sh));

/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

/*
Shared code between server and client

NOTE: This file shouldn't be compressed with the rest of the js files
or else NodeJS would be unable to find it.
 */

(function(exports){

    exports.test = function(){
        return 'Shared code test.';
    };

}(typeof exports === 'undefined' ? window.shared = {} : exports));

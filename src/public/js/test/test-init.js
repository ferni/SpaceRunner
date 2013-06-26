/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global QUnit, th */

/**
*Autostart config
*/
QUnit.config.autostart = false;

QUnit.done(function(e) {
    'use strict';
});

th.onGameReady(function() {
   'use strict';
    var onNodeJS = false;
    $.post('ping', function(data){
        if(data.ok) {
            onNodeJS = true;
        }
    }, 'json')
        .always(function(){
            if(onNodeJS) {
                //nodejs is running
                registerTestsRequiringNodeJS();
            }
            QUnit.start();
        });
});

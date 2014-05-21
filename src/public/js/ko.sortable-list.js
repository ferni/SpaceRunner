/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global ko, $, _*/

/**
 * Makes a list sortable.
 * @type {{init: init, update: update}}
 */
ko.bindingHandlers.sortableList = {
    init: function(element, valueAccessor) {
        'use strict';
        var list = valueAccessor();
        $(element).sortable().bind('sortupdate', function() {
            //reconstruct the list
            list(_.map($(this).children(), function(item) {
                return ko.dataFor(item).m;
            }));
        });
    },
    update: function(element, valueAccessor) {
        'use strict';
        valueAccessor()();
        $(element).sortable();
    }

};

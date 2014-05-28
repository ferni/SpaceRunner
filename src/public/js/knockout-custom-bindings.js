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

/**
 * Timeline functionality for showing details when hovering
 * event marks.
 * @type {{init: init}}
 */
ko.bindingHandlers.timeline = {
    init: function(element, valueAccessor) {
        'use strict';
        var $mouseMarker = $('#mouse-marker'),
            timeline = valueAccessor(),
            jScrollApi;
        //manually set height for jScrollPane to work properly
        $('#time-ruler').css('height', timeline.getHeight() + 'px');
        jScrollApi = $(element).jScrollPane().data('jsp');
        $('#numbers').hover(function() {
            $mouseMarker.show();
        }, function() {
            $mouseMarker.hide();
        }).mousemove(function(e) {
            var time = (e.clientY - 125 + jScrollApi.getContentPositionY()) *
                10;
            $mouseMarker.css('top', (e.clientY - 18) + 'px');
            console.log('Time pointed: ' + time);
        });
    }
};


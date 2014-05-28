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
            $markerLabels = $('#marker-labels'),
            timeline = valueAccessor(),
            jScrollApi,
            minMovementForLabel = 30,
            lastMarkerLabel = -100;
        //manually set height for jScrollPane to work properly
        $('#time-ruler').css('height', timeline.getHeight() + 'px');
        jScrollApi = $(element).jScrollPane().data('jsp');
        $('#numbers').hover(function() {
            $mouseMarker.show();
        }, function() {
            $mouseMarker.hide();
        }).mousemove(function(e) {
            var time = (e.clientY - 125 + jScrollApi.getContentPositionY()) *
                10,
                markers;
            $mouseMarker.css('top', (e.clientY - 18) + 'px');
            if (lastMarkerLabel - time >= minMovementForLabel ||
                    time - lastMarkerLabel >= minMovementForLabel) {
                markers = timeline.getMarkersNear(time);
                $markerLabels.html('');
                if (markers.length > 0) {
                    $markerLabels.css('top', (markers[0].time / 10) + 'px');
                    _.each(markers, function(m) {
                        $markerLabels.append('<div class="marker-label" ' +
                            'style="background-color: ' + m.color + '">' +
                            m.legend + '</div>');
                    });
                }
                lastMarkerLabel = time;
            }
        });
    }
};


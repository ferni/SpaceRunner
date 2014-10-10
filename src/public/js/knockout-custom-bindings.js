/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global ko, $, _, dhtmlxSlider, utils*/

/**
 * Makes a list sortable.
 * @type {{init: init, update: update}}
 */
ko.bindingHandlers.sortableList = {
    init: function(element, valueAccessor) {
        'use strict';
        var list = valueAccessor(),
            adjustment;
        $(element).sortable({
            // animation on drop
            onDrop: function(item, targetContainer, _super) {
                var clonedItem = $('<li class="cloned"/>').css({height: 0});
                item.before(clonedItem);
                clonedItem.animate({'height': item.height()});

                item.animate(clonedItem.position(), function() {
                    clonedItem.detach();
                    item.removeClass('dragged')
                        .css('left', '')
                        .css('top', '');
                    $('body').removeClass('dragging');
                    //reconstruct the list
                    list(_.map($(element).children(), function(item) {
                        return ko.dataFor(item).m;
                    }));
                });
            },

            // set item relative to cursor position
            onDragStart: function($item, container, _super) {
                var offset = $item.offset(),
                    pointer = container.rootGroup.pointer;

                adjustment = {
                    left: pointer.left - offset.left,
                    top: pointer.top - offset.top
                };

                _super($item, container);
            },
            onDrag: function($item, position) {
                $item.css({
                    left: position.left - adjustment.left,
                    top: position.top - adjustment.top
                });
            }
        });
    },
    update: function(element, valueAccessor) {
        'use strict';
        var list = valueAccessor();
        if (list().length === 1) {
            $(element).sortable('disable');
        } else {
            $(element).sortable('enable');
        }
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
            $markerLabelsCont = $('#marker-labels-container'),
            $markerLabels = $('#marker-labels'),
            timeline = valueAccessor(),
            jScrollApi,
            sld;

        jScrollApi = $(element).jScrollPane().data('jsp');
        $(window).resize(_.throttle(function() {
            jScrollApi.reinitialise();
        }, 250, {leading: false}));
        //zoom slider
        sld = new dhtmlxSlider('zoom-slider', 150,
            'arrowgreen', false, 0.25, 3, 1, 0.25);
        sld.setImagePath('data/img/render/slider/');
        $('#zoom-slider').append(sld);
        sld.setOnChangeHandler(function(value) {
            timeline.zoomLevel(value);
            jScrollApi.reinitialise();
        });
        sld.init();

        $('#numbers').hover(function() {
            $mouseMarker.show();
        }, function() {
            $mouseMarker.hide();
        }).mousemove(function(e) {
            var pixelTime = e.clientY - 125 + jScrollApi.getContentPositionY(),
                time = pixelTime * 10 / timeline.zoomLevel(),
                markers;
            $mouseMarker.css('top', (e.clientY - 18) + 'px');
            markers = timeline.getMarkersNear(pixelTime);
            $markerLabels.html('');
            if (markers.length > 0) {
                $markerLabelsCont.css('top', ((markers[0].time / 10 *
                    timeline.zoomLevel()) - 99) + 'px');
                    //-99 because it has 200 height (for centering)
                _.each(markers, function(m) {
                    $markerLabels.append('<div class="marker-label" ' +
                        'style="background-color: ' + m.color + '">' +
                        m.legend + '</div>');
                });
                $markerLabelsCont.show();
            } else {
                $markerLabelsCont.hide();
            }
        });
    }
};


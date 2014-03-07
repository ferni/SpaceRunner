/**
 * Based on
 * http://www.knockmeout.net/2011/05/dragging-dropping-and-sorting-with.html
 * Adapted for use with HTML5 sortable
 * (http://farhadi.ir/projects/html5sortable/)
 */

/*global ko, $, _*/

ko.bindingHandlers.sortableList = {
    init: function(element, valueAccessor) {
        'use strict';
        var list = valueAccessor();
        $(element).sortable().bind('sortupdate', function() {
            //reconstruct the list
            list(_.map($(this).children(), function(item) {
                return ko.dataFor(item);
            }));
        });
    },
    update: function(element, valueAccessor) {
        'use strict';
        valueAccessor()();
        $(element).sortable();
    }

};
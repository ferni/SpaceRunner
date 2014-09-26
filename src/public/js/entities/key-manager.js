/*global me, _*/

var KeyManager = function(screen) {
    'use strict';
    //todo: use screen.shipFrames
    var bindings = [];
    return {
        bind: function(key, handler) {
            me.input.bindKey(key, key, true);
            bindings.push({key: key, handler: handler});
        },
        unbindAll: function() {
            _.each(bindings, function(b) {
                me.input.unbindKey(b.key);
            });
        },
        processBindings: function() {
            _.each(bindings, function(b) {
                if (me.input.isKeyPressed(b.key)) {
                    b.handler();
                }
            });
        }
    };
};

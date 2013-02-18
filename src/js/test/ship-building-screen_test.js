module('ship-building-screen.js');
asyncTest('ESC key un-chooses the item', function () {
    'use strict';
    th.loadBuildScreen(function (screen) {
        screen.choose('power');
        ok(screen.chosen, 'something chosen');
        me.input.triggerKeyEvent(me.input.KEY.ESC, true);
        screen.update();
        me.input.triggerKeyEvent(me.input.KEY.ESC, false);
        ok(!screen.chosen, 'Nothing is chosen after hitting escape');
        start();
    });
});

asyncTest('mouseDbClick does not give an error when mouse is not locked',
    function () {
    'use strict';
    th.loadBuildScreen(function (screen) {
        me.state.change(me.state.BUILD);
        equal(screen.mouseLockedOn, null, 'Mouse is not locked');
        screen.mouseDbClick({
            which: me.input.mouse.LEFT
        });
        start();
    });
});

asyncTest('right click removes item', function () {
    'use strict';
    th.loadBuildScreen(function (screen) {
        var x = th.shipPositions.free.x,
            y = th.shipPositions.free.y;
        screen.ship.buildAt(x, y, 'component');
        equal(screen.ship.mapAt(x, y).type, 'component', 'Component built');
        th.mouseBegin();
        th.rightClick(x + 1, y + 1); //botton right of component
        th.mouseEnd();
        notEqual(screen.ship.mapAt(x, y).type, 'component', 'Component removed');
        start();
    });
});

asyncTest('drag and drop', function () {
    'use strict';
    th.loadBuildScreen(function (screen) {
        var power;
        ok(screen.ship.buildAt(3, 4, 'power'), 'power succesfully built');
        th.mouseBegin();
        th.moveMouse(3, 4);
        screen.mouseDown({
            which: me.input.mouse.LEFT
        });
        equal(screen.dragging.type, 'power', 'power being dragged');

        th.moveMouse(5, 4);
        screen.mouseUp({
            which: me.input.mouse.LEFT
        });
        ok(!screen.dragging, 'not dragging after mouse up');
        notEqual(screen.ship.mapAt(3, 4).type, 'power',
            'power is not on original position');
        power = screen.ship.mapAt(5, 4);
        equal(power.x(), 5, 'power is at new position');
        th.mouseEnd();
        start();
    });
});
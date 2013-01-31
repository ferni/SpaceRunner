module('test_helpers.js');
asyncTest('onLevelReady', function() {
    th.onLevelReady(function() {
        ok(me.state.isCurrent(me.state.PLAY), 'Level is indeed ready');
        start();
    });
});

asyncTest('setMouse', function() {
    th.onLevelReady(function() {
        th.mouseBegin();
        th.setMouse(4, 6);
        equal(utils.getMouse().x, 4, 'x');
        equal(utils.getMouse().y, 6, 'y');
        th.mouseEnd();
        start();
    });
});
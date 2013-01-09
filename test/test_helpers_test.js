th.onLevelReady(function () {
    module("test_helpers.js");
    test("onLevelReady", function () {
        ok(me.state.isCurrent(me.state.PLAY), "Level is indeed ready");
    });

    test("setMouse", function () {
        th.setMouse(4, 6);
        equal(utils.getMouse().x, 4, "x");
        equal(utils.getMouse().y, 6, "y");
    });
});
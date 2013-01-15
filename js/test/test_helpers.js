var th = {
    shipPositions: {
        free: { x: 4, y: 4 },
        engine: { x: 3, y: 1 },
        weapon: { x: 5, y: 2 },
        solid: { x: 13, y: 1 }
    },
    onLevelReady: function (callback) {
        var interval = setInterval(function () {
            if (me.state.isCurrent(me.state.PLAY)) {
                callback();
                clearInterval(interval);
            }
        }, 100);
    },
    resetEverything: function (callback) {
        me.state.change(me.state.GAMEOVER);
        jsApp.loaded("test");
        th.onLevelReady(callback);
    },
    _originalGetMouseFunction: utils.getMouse,
    _mousePosition: {x:1,y:1},
    mouseBegin: function() {
        //replace utils.getMouse function
        utils.getMouse = function () {
            var vector = new me.Vector2d();
            vector.x = th._mousePosition.x;
            vector.y = th._mousePosition.y;
            return vector;
        };
    },
    mouseEnd : function() {
        utils.getMouse = this._originalGetMouseFunction;
    },
    //fakes the mouse position (x: tile column, y: tile row)
    setMouse: function (x, y) {
        this._mousePosition.x = x;
        this._mousePosition.y = y;
    },
    moveMouse: function (x, y) {
        this.setMouse(x, y);
        screen.mouseMove({});
    },
    clickMouse: function (which, x, y) {
        if (x != undefined && y != undefined) {
            this.moveMouse(x, y);
        }
        screen.mouseDown({ which: which });
        screen.mouseUp({ which: which });
    },
    leftClick: function (x, y) {
        this.clickMouse(me.input.mouse.LEFT, x, y);
    },
    rightClick: function (x, y) {
        this.clickMouse(me.input.mouse.RIGHT, x, y);
    }
};

/*
 --- Clean test template ---

    asyncTest("", function () {
        th.resetEverything(function () {
            //test here
            start();
        });
    });

*/